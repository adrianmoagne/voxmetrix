"""Reproduce the paper's MOS x EyetrackingMOS analysis from the public CSVs.

    python3 run_all.py

Reads ../data, writes tables, figures and summary.json to ./output. The script
runs top to bottom in main(); the helpers above it are grouped by section.
"""
import json
import warnings
from pathlib import Path

import numpy as np
import pandas as pd
import statsmodels.formula.api as smf
from scipy import stats
from statsmodels.stats.multitest import multipletests

import figures
import gaze

HERE = Path(__file__).resolve().parent
DATA_DIR = HERE.parent / "data"
OUTPUT_DIR = HERE / "output"

SEED = 12345
N_BOOTSTRAP = 5000  # speaker-cluster resamples for correlation intervals
N_BALANCED = 1000  # random 2:1 non-specialist:specialist panels
MIN_SAMPLE_RATE_HZ = 10.0  # gaze quality gate
MIN_VALID_DWELL_PCT = 80.0  # gaze quality gate
KEYS = ["participant", "audio_identifier"]


def check(condition, message):
    if not condition:
        raise ValueError(message)


# ----------------------------------------------------------------------------- 1. data


def load_and_validate():
    mos = pd.read_csv(DATA_DIR / "mos_trials.csv")
    et = pd.read_csv(DATA_DIR / "eyetracking_trials.csv")
    samples = pd.read_csv(DATA_DIR / "eyetracking_gaze_samples.csv.gz")

    check(not mos.duplicated(KEYS).any() and not et.duplicated(KEYS).any(), "duplicate participant/audio trials")
    check(set(map(tuple, mos[KEYS].values)) == set(map(tuple, et[KEYS].values)), "MOS and eye-tracking trials do not match")
    per_participant = mos.groupby("participant").size()
    check(per_participant.nunique() == 1, "participants have different numbers of trials")
    check(set(samples["participant"]) == set(mos["participant"]), "gaze samples and trials have different participants")
    check(et["eyetracking_mos"].notna().all(), "some trials have no EyetrackingMOS (no gaze while the audio played)")
    print(f"    {len(per_participant)} participants x {per_participant.iloc[0]} trials, {len(samples):,} gaze samples")
    return mos, et, samples


# ----------------------------------------------------------------------------- 2. scores


def merge_scores(mos, et):
    """One row per participant x audio with both scores."""
    return pd.merge(
        mos[KEYS + ["condition", "speaker", "voice_type", "mos_rating"]],
        et[KEYS + ["eyetracking_mos", "person_gaze_pct"]],
        on=KEYS,
    )


def audio_means(merged):
    """One row per audio: mean scores over participants."""
    return (
        merged.groupby("audio_identifier")
        .agg(
            voice_type=("voice_type", "first"),
            list=("condition", "first"),
            speaker=("speaker", "first"),
            n_participants=("participant", "nunique"),
            mean_mos=("mos_rating", "mean"),
            sd_mos=("mos_rating", "std"),
            mean_eyetrackingmos=("eyetracking_mos", "mean"),
            sd_eyetrackingmos=("eyetracking_mos", "std"),
            mean_person_gaze_pct=("person_gaze_pct", "mean"),
        )
        .reset_index()
    )


# ----------------------------------------------------------------------------- 3. correlations


def agreement(x, y):
    """How well y tracks x: correlations plus error of y as a predictor of x."""
    x, y = np.asarray(x, float), np.asarray(y, float)
    r, r_p = stats.pearsonr(x, y)
    rho, rho_p = stats.spearmanr(x, y)
    err = x - y
    return {
        "n_audios": len(x),
        "pearson_r": r,
        "pearson_p": r_p,
        "spearman_rho": rho,
        "spearman_p": rho_p,
        "r2": r * r,
        "rmse": float(np.sqrt(np.mean(err**2))),
        "mae": float(np.mean(np.abs(err))),
    }


def within_voice_type(audio):
    """Center both scores within natural and within synthetic, removing the gap between them."""
    out = audio.copy()
    for col in ("mean_mos", "mean_eyetrackingmos"):
        out[col] = out[col] - out.groupby("voice_type")[col].transform("mean")
    return out


def correlation_subsets(audio):
    return {
        "all": audio,
        "natural": audio[audio["voice_type"] == "natural"],
        "synthetic": audio[audio["voice_type"] == "synthetic"],
        "voice_adjusted": within_voice_type(audio),
    }


def correlations_with_intervals(audio):
    """Agreement per subset, with 95% intervals from resampling speakers (clusters of audios)."""
    rows = []
    for name, subset in correlation_subsets(audio).items():
        row = {"subset": name, **agreement(subset["mean_mos"], subset["mean_eyetrackingmos"])}
        rng = np.random.default_rng(SEED)
        speakers = subset["speaker"].unique()
        by_speaker = {s: subset[subset["speaker"] == s] for s in speakers}
        boot = []
        for _ in range(N_BOOTSTRAP):
            drawn = rng.choice(speakers, size=len(speakers), replace=True)
            sample = pd.concat([by_speaker[s] for s in drawn])
            boot.append(agreement(sample["mean_mos"], sample["mean_eyetrackingmos"]))
        boot = pd.DataFrame(boot)
        for metric in ("pearson_r", "spearman_rho", "r2", "rmse"):
            low, high = np.nanpercentile(boot[metric], [2.5, 97.5])
            row[f"{metric}_ci_low"], row[f"{metric}_ci_high"] = low, high
        rows.append(row)
    return pd.DataFrame(rows)


# ----------------------------------------------------------------------------- 4. specialist robustness


def balanced_panels(merged, specialists):
    """Redo the audio-level correlations on random panels of all specialists + 2x as many
    non-specialists drawn from the same stimulus list. Reports the spread over panels."""
    rng = np.random.default_rng(SEED)
    conditions = merged.drop_duplicates("participant").set_index("participant")["condition"]
    specialist_ids = set(specialists["participant"])
    pools = {}
    for condition, group in specialists.groupby("condition"):
        pool = [p for p, c in conditions.items() if c == condition and p not in specialist_ids]
        need = 2 * len(group)
        check(len(pool) >= need, f"list {condition} has fewer than {need} non-specialists")
        pools[condition] = (pool, need)

    by_participant = dict(tuple(merged.groupby("participant")))
    results = []
    for _ in range(N_BALANCED):
        panel = list(specialist_ids)
        for pool, need in pools.values():
            panel += list(rng.choice(pool, size=need, replace=False))
        audio = audio_means(pd.concat([by_participant[p] for p in panel]))
        for name, subset in correlation_subsets(audio).items():
            a = agreement(subset["mean_mos"], subset["mean_eyetrackingmos"])
            results.append({"subset": name, "n_audios": a["n_audios"], "pearson_r": a["pearson_r"], "spearman_rho": a["spearman_rho"]})
    results = pd.DataFrame(results)
    return (
        results.groupby(["subset", "n_audios"], sort=False)
        .agg(
            pearson_r_median=("pearson_r", "median"),
            pearson_r_pct_2_5=("pearson_r", lambda v: v.quantile(0.025)),
            pearson_r_pct_97_5=("pearson_r", lambda v: v.quantile(0.975)),
            spearman_rho_median=("spearman_rho", "median"),
            spearman_rho_pct_2_5=("spearman_rho", lambda v: v.quantile(0.025)),
            spearman_rho_pct_97_5=("spearman_rho", lambda v: v.quantile(0.975)),
            n_panels=("pearson_r", "size"),
        )
        .reset_index()
    )


# ----------------------------------------------------------------------------- 5. natural vs synthetic


def paired_effect(df, score):
    """Cohen's dz of natural - synthetic on participant means."""
    per = df.groupby(["participant", "voice_type"])[score].mean().unstack().dropna()
    diff = per["natural"] - per["synthetic"]
    return diff.mean() / diff.std(ddof=1), len(diff)


def mixed_effects(merged, score, label):
    """score ~ natural, with crossed random intercepts for participant and stimulus."""
    data = merged[["participant", "audio_identifier", "voice_type", score]].dropna().copy()
    data["natural"] = (data["voice_type"] == "natural").astype(float)
    data["score"] = data[score]
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        fit = smf.mixedlm(
            "score ~ natural",
            data,
            groups=np.ones(len(data)),
            vc_formula={"participant": "0 + C(participant)", "stimulus": "0 + C(audio_identifier)"},
        ).fit(reml=True, method="lbfgs")
    dz, n_participants = paired_effect(merged, score)
    ci_low, ci_high = fit.conf_int().loc["natural"]
    return {
        "outcome": label,
        "term": "natural_minus_synthetic",
        "estimate": fit.params["natural"],
        "std_error": fit.bse["natural"],
        "ci_low": ci_low,
        "ci_high": ci_high,
        "p_value": fit.pvalues["natural"],
        "cohens_dz": dz,
        "n_participants": n_participants,
        "n_obs": len(data),
    }


# ----------------------------------------------------------------------------- 6. gaze quality


def gaze_quality(et):
    quality = et[
        [
            "participant",
            "condition",
            "audio_identifier",
            "voice_type",
            "speaker",
            "gaze_sample_count",
            "audio_time_covered_s",
            "audio_duration_s",
            "audio_coverage_pct",
            "gaze_sample_rate_hz",
            "person_dwell_s",
            "robot_dwell_s",
            "off_screen_dwell_s",
            "valid_dwell_pct",
        ]
    ].copy()
    quality["pass_rate"] = quality["gaze_sample_rate_hz"] >= MIN_SAMPLE_RATE_HZ
    quality["pass_valid_dwell"] = quality["valid_dwell_pct"] >= MIN_VALID_DWELL_PCT
    quality["pass_quality"] = quality["pass_rate"] & quality["pass_valid_dwell"]
    return quality


# ----------------------------------------------------------------------------- 7. gaze dynamics


def gaze_dynamics(samples, et):
    """Per-trial dynamics metrics (see gaze.trial_dynamics)."""
    rows = []
    for (participant, trial_index), g in samples.groupby(["participant", "trial_index"], sort=True):
        g = g.sort_values("t_ms")
        row = {"participant": participant, "trial_index": trial_index}
        row.update(
            gaze.trial_dynamics(
                g["t_ms"].to_numpy(float),
                g["x"].to_numpy(float),
                g["y"].to_numpy(float),
                g["audio_time_s"].to_numpy(float),
                g["aoi"].tolist(),
                float(g["screen_diag"].iloc[0]),
            )
        )
        rows.append(row)
    info = et[["participant", "trial_index", "condition", "engine", "audio_identifier", "speaker", "voice_type"]]
    return info.merge(pd.DataFrame(rows), on=["participant", "trial_index"]).sort_values(["participant", "trial_index"]).reset_index(drop=True)


def paired_tests(trials):
    """Natural vs synthetic on participant means, one paired t-test per metric, FDR-corrected."""
    rows = []
    for metric in gaze.DYNAMICS_METRICS:
        per = trials.groupby(["participant", "voice_type"])[metric].mean().unstack().dropna()
        diff = per["natural"] - per["synthetic"]
        t, p = stats.ttest_rel(per["natural"], per["synthetic"])
        rows.append(
            {
                "metric": metric,
                "mean_natural": per["natural"].mean(),
                "mean_synthetic": per["synthetic"].mean(),
                "mean_diff": diff.mean(),
                "t_stat": t,
                "p_value": p,
                "cohens_dz": diff.mean() / diff.std(ddof=1) if diff.std(ddof=1) > 0 else np.nan,
                "n_participants": len(diff),
            }
        )
    out = pd.DataFrame(rows)
    out["p_value_fdr"] = multipletests(out["p_value"], method="fdr_bh")[1]
    return out


def dynamics_vs_mos(trials, mos):
    """Audio-level correlation of each dynamics metric with MOS, raw and within voice type."""
    audio = mos.groupby("audio_identifier").agg(mean_mos=("mos_rating", "mean"), voice_type=("voice_type", "first"))
    audio = audio.join(trials.groupby("audio_identifier")[gaze.DYNAMICS_METRICS].mean())
    rows = []
    for metric in gaze.DYNAMICS_METRICS:
        sub = audio[["mean_mos", "voice_type", metric]].dropna()
        r, r_p = stats.pearsonr(sub["mean_mos"], sub[metric])
        rho, rho_p = stats.spearmanr(sub["mean_mos"], sub[metric])
        centered = sub[["mean_mos", metric]] - sub.groupby("voice_type")[["mean_mos", metric]].transform("mean")
        adj_r, adj_p = stats.pearsonr(centered["mean_mos"], centered[metric])
        rows.append(
            {
                "metric": metric,
                "pearson_r": r,
                "pearson_p": r_p,
                "spearman_rho": rho,
                "spearman_p": rho_p,
                "voice_adjusted_pearson_r": adj_r,
                "voice_adjusted_pearson_p": adj_p,
                "n_audios": len(sub),
            }
        )
    return pd.DataFrame(rows)


# ----------------------------------------------------------------------------- main


def save(df, name):
    df.to_csv(OUTPUT_DIR / name, index=False)


def main():
    OUTPUT_DIR.mkdir(exist_ok=True)

    print("[1/8] data")
    mos, et, samples = load_and_validate()

    print("[2/8] scores")
    merged = merge_scores(mos, et)
    audio = audio_means(merged)
    save(merged.rename(columns={"mos_rating": "score_mos", "eyetracking_mos": "score_eyetrackingmos"}), "participant_audio_scores.csv")
    save(audio, "audio_level_comparison.csv")

    print("[3/8] correlations")
    correlations = correlations_with_intervals(audio).set_index("subset")
    save(correlations.reset_index(), "correlations.csv")

    print("[4/8] specialist robustness")
    specialists_path = DATA_DIR / "specialist_participants.csv"
    specialists = pd.read_csv(specialists_path) if specialists_path.exists() else pd.DataFrame(columns=["participant", "condition"])
    if len(specialists):
        save(balanced_panels(merged, specialists), "balanced_2to1_correlations.csv")
    else:
        print("    skipped: no specialist roster")

    print("[5/8] mixed effects")
    mixed = pd.DataFrame([mixed_effects(merged, "mos_rating", "MOS"), mixed_effects(merged, "eyetracking_mos", "EyetrackingMOS")])
    save(mixed, "mixed_effects_condition_tests.csv")

    print("[6/8] gaze quality")
    quality = gaze_quality(et)
    save(quality, "gaze_quality_summary.csv")
    kept = merged.merge(quality.loc[quality["pass_quality"], KEYS], on=KEYS)
    save(correlations_with_intervals(audio_means(kept)), "gaze_quality_sensitivity_correlations.csv")

    print("[7/8] gaze dynamics")
    dynamics = gaze_dynamics(samples, et)
    dynamics_tests = paired_tests(dynamics)
    save(dynamics, "gaze_dynamics_trials.csv")
    save(dynamics_tests, "gaze_dynamics_paired_tests.csv")
    save(dynamics_vs_mos(dynamics, mos), "gaze_dynamics_audio_correlations.csv")

    print("[8/8] figures and summary")
    figures.make_all(audio, dynamics_tests, samples, OUTPUT_DIR / "figures")

    def ci(subset, metric):
        row = correlations.loc[subset]
        return {"value": row[metric], "ci_low": row[f"{metric}_ci_low"], "ci_high": row[f"{metric}_ci_high"]}

    summary = {
        "n_participants": int(mos["participant"].nunique()),
        "n_mos_trials": len(mos),
        "n_eyetracking_trials": len(et),
        "n_gaze_samples": len(samples),
        "n_audios": len(audio),
        "quality_pass_rate_pct": round(100 * quality["pass_quality"].mean(), 2),
        "pearson_overall": ci("all", "pearson_r"),
        "pearson_natural": ci("natural", "pearson_r"),
        "pearson_synthetic": ci("synthetic", "pearson_r"),
        "pearson_voice_adjusted": ci("voice_adjusted", "pearson_r"),
        "rmse_overall": ci("all", "rmse"),
        "mixed_effects_natural_minus_synthetic": {
            row["outcome"]: {k: row[k] for k in ("estimate", "ci_low", "ci_high", "p_value", "cohens_dz")}
            for _, row in mixed.iterrows()
        },
        "specialists_by_condition": specialists.groupby("condition").size().to_dict(),
    }
    with open(OUTPUT_DIR / "summary.json", "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2, default=float)
    print(f"done, outputs in {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
