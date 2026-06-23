"""Recompute gaze-dynamics trial metrics, paired tests, and MOS correlations."""
import math
import os

import numpy as np
import pandas as pd
from scipy import stats
from statsmodels.stats.multitest import multipletests

from analysis import common

MIN_FIX_MS = 100.0
DISP_PX = 80.0
METRICS = [
    "person_gaze_pct",
    "aoi_entropy_bits",
    "time_to_first_person_sec",
    "fixation_rate_hz",
    "mean_fixation_duration_ms",
    "saccade_rate_hz",
    "mean_saccade_amplitude_screen_diag",
    "aoi_switch_rate_hz",
    "scanpath_screen_diag_per_sec",
]


def idt_fixations(t, x, y, min_ms=MIN_FIX_MS, dispersion_threshold=DISP_PX):
    fixations = []
    i, n = 0, len(t)
    while i < n:
        j = i
        while j < n and t[j] - t[i] < min_ms:
            j += 1
        if j >= n:
            break

        def dispersion(start, end):
            return (
                x[start : end + 1].max()
                - x[start : end + 1].min()
                + y[start : end + 1].max()
                - y[start : end + 1].min()
            )

        if dispersion(i, j) <= dispersion_threshold:
            while j + 1 < n and dispersion(i, j + 1) <= dispersion_threshold:
                j += 1
            fixations.append(
                {
                    "duration": t[j] - t[i],
                    "cx": float(x[i : j + 1].mean()),
                    "cy": float(y[i : j + 1].mean()),
                }
            )
            i = j + 1
        else:
            i += 1
    return fixations


def _dwell(t, aoi):
    dwell = {"person": 0.0, "robot": 0.0, "off_screen": 0.0}
    for i in range(len(t) - 1):
        dwell[aoi[i]] += t[i + 1] - t[i]
    return dwell


def _entropy(dwell):
    total = sum(dwell.values())
    if total <= 0:
        return np.nan
    return -sum((value / total) * math.log2(value / total) for value in dwell.values() if value)


def _switches(aoi):
    sequence = [value for value in aoi if value in ("person", "robot")]
    return sum(sequence[i] != sequence[i - 1] for i in range(1, len(sequence)))


def _trial_metrics(group):
    group = group.sort_values("t_ms")
    t = group["t_ms"].to_numpy(float)
    x = group["x"].to_numpy(float)
    y = group["y"].to_numpy(float)
    audio_time = group["audio_time_s"].to_numpy(float)
    aoi = group["aoi"].tolist()
    diagonal = float(group["screen_diag"].iloc[0])
    output = {metric: np.nan for metric in METRICS}
    if len(t) < 2 or t[-1] <= t[0]:
        return output

    duration_seconds = (t[-1] - t[0]) / 1000.0
    dwell = _dwell(t, aoi)
    valid = dwell["person"] + dwell["robot"]
    output["person_gaze_pct"] = 100 * dwell["person"] / valid if valid else np.nan
    output["aoi_entropy_bits"] = _entropy(dwell)

    first_person = next((i for i, value in enumerate(aoi) if value == "person"), None)
    if first_person is not None:
        output["time_to_first_person_sec"] = float(audio_time[first_person])

    fixations = idt_fixations(t, x, y)
    output["fixation_rate_hz"] = len(fixations) / duration_seconds
    if fixations:
        output["mean_fixation_duration_ms"] = float(
            np.mean([fixation["duration"] for fixation in fixations])
        )
    if len(fixations) >= 2:
        amplitudes = [
            math.hypot(
                fixations[i]["cx"] - fixations[i - 1]["cx"],
                fixations[i]["cy"] - fixations[i - 1]["cy"],
            )
            for i in range(1, len(fixations))
        ]
        output["saccade_rate_hz"] = (len(fixations) - 1) / duration_seconds
        output["mean_saccade_amplitude_screen_diag"] = float(np.mean(amplitudes)) / diagonal
    else:
        output["saccade_rate_hz"] = 0.0
    output["aoi_switch_rate_hz"] = _switches(aoi) / duration_seconds
    output["scanpath_screen_diag_per_sec"] = (
        np.hypot(np.diff(x), np.diff(y)).sum() / diagonal / duration_seconds
    )
    return output


def build_trials(samples=None):
    samples = common.load_gaze_samples() if samples is None else samples
    group_columns = [
        "participant",
        "condition",
        "engine",
        "audio_identifier",
        "voice_type",
        "trial_index",
    ]
    rows = []
    for keys, group in samples.groupby(group_columns, sort=True):
        row = dict(zip(group_columns, keys))
        row["speaker"] = common.speaker(row["audio_identifier"])
        row.update(_trial_metrics(group))
        rows.append(row)
    result = pd.DataFrame(rows).sort_values(["participant", "trial_index"]).reset_index(drop=True)
    columns = [
        "participant",
        "condition",
        "engine",
        "audio_identifier",
        "speaker",
        "voice_type",
        *METRICS,
    ]
    return result[columns]


def paired_tests(trials):
    rows = []
    for metric in METRICS:
        per = trials.groupby(["participant", "voice_type"])[metric].mean().unstack("voice_type")
        per = per.dropna(subset=["natural", "synthetic"])
        natural, synthetic = per["natural"], per["synthetic"]
        difference = natural - synthetic
        t_stat, p_value = stats.ttest_rel(natural, synthetic)
        std = difference.std(ddof=1)
        rows.append(
            {
                "metric": metric,
                "mean_natural": natural.mean(),
                "mean_synthetic": synthetic.mean(),
                "mean_diff": difference.mean(),
                "t_stat": t_stat,
                "p_value": p_value,
                "cohens_dz": difference.mean() / std if std > 0 else np.nan,
                "n_participants": len(difference),
            }
        )
    result = pd.DataFrame(rows)
    result["p_value_fdr"] = multipletests(result["p_value"], method="fdr_bh")[1]
    return result


def audio_correlations(trials, mos):
    dynamics = trials.groupby("audio_identifier")[METRICS].mean()
    audio = (
        mos.groupby("audio_identifier")
        .agg(mean_mos=("mos_rating", "mean"), voice_type=("voice_type", "first"))
        .join(dynamics)
    )
    rows = []
    for metric in METRICS:
        subset = audio[["mean_mos", "voice_type", metric]].dropna()
        pearson_r, pearson_p = stats.pearsonr(subset["mean_mos"], subset[metric])
        spearman_rho, spearman_p = stats.spearmanr(subset["mean_mos"], subset[metric])
        adjusted = subset.copy()
        adjusted["mos"] = adjusted["mean_mos"] - adjusted.groupby("voice_type")[
            "mean_mos"
        ].transform("mean")
        adjusted["metric"] = adjusted[metric] - adjusted.groupby("voice_type")[metric].transform(
            "mean"
        )
        adjusted_r, adjusted_p = stats.pearsonr(adjusted["mos"], adjusted["metric"])
        rows.append(
            {
                "metric": metric,
                "pearson_r": pearson_r,
                "pearson_p": pearson_p,
                "spearman_rho": spearman_rho,
                "spearman_p": spearman_p,
                "voice_adjusted_pearson_r": adjusted_r,
                "voice_adjusted_pearson_p": adjusted_p,
                "n_audios": len(subset),
            }
        )
    return pd.DataFrame(rows)


def build(samples=None, mos=None):
    mos = common.load_mos() if mos is None else mos
    trials = build_trials(samples)
    return trials, paired_tests(trials), audio_correlations(trials, mos)


def write(trials, paired, correlations):
    common.ensure_dirs()
    paths = [
        os.path.join(common.OUTPUT_DIR, "gaze_dynamics_trials.csv"),
        os.path.join(common.OUTPUT_DIR, "gaze_dynamics_paired_tests.csv"),
        os.path.join(common.OUTPUT_DIR, "gaze_dynamics_audio_correlations.csv"),
    ]
    trials.to_csv(paths[0], index=False)
    paired.to_csv(paths[1], index=False)
    correlations.to_csv(paths[2], index=False)
    return paths
