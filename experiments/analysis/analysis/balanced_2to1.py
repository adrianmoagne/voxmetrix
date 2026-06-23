"""2:1 non-specialist-to-specialist robustness analysis."""
import os

import numpy as np
import pandas as pd

from analysis import common, scores
from analysis.stats_correlations import point_metrics

N_SAMPLES = 1000
SEED = 12345
RATIO = 2
SUBSETS = ["all", "natural", "synthetic", "voice_adjusted"]
SUBSET_N = {"all": 120, "natural": 60, "synthetic": 60, "voice_adjusted": 120}


def _metrics(audio):
    output = {}
    values = point_metrics(audio["mean_mos"], audio["mean_eyetrackingmos"])
    output["all"] = values["pearson_r"], values["spearman_rho"]
    for voice_type in ("natural", "synthetic"):
        subset = audio[audio["voice_type"] == voice_type]
        values = point_metrics(subset["mean_mos"], subset["mean_eyetrackingmos"])
        output[voice_type] = values["pearson_r"], values["spearman_rho"]
    adjusted = audio.copy()
    adjusted["mos"] = adjusted["mean_mos"] - adjusted.groupby("voice_type")[
        "mean_mos"
    ].transform("mean")
    adjusted["et"] = adjusted["mean_eyetrackingmos"] - adjusted.groupby("voice_type")[
        "mean_eyetrackingmos"
    ].transform("mean")
    values = point_metrics(adjusted["mos"], adjusted["et"])
    output["voice_adjusted"] = values["pearson_r"], values["spearman_rho"]
    return output


def build(merged=None, specialists=None, n_samples=N_SAMPLES, seed=SEED, ratio=RATIO):
    merged = scores.build()[2] if merged is None else merged
    specialists = common.load_specialists() if specialists is None else specialists
    specialist_ids = specialists["participant"].tolist()
    participant_conditions = (
        merged[["participant", "condition"]].drop_duplicates().set_index("participant")["condition"]
    )
    specialists_by_list = {
        condition: specialists.loc[specialists["condition"] == condition, "participant"].tolist()
        for condition in sorted(specialists["condition"].unique())
    }
    specialist_set = set(specialist_ids)
    nonspecialists_by_list = {
        condition: [
            participant
            for participant, value in participant_conditions.items()
            if value == condition and participant not in specialist_set
        ]
        for condition in specialists_by_list
    }
    draw_counts = {
        condition: ratio * len(participants)
        for condition, participants in specialists_by_list.items()
    }
    for condition, count in draw_counts.items():
        if len(nonspecialists_by_list[condition]) < count:
            raise ValueError(f"Condition {condition} does not have {count} non-specialists.")

    grouped = {participant: group for participant, group in merged.groupby("participant")}
    rng = np.random.default_rng(seed)
    samples = {subset: {"pearson": [], "spearman": []} for subset in SUBSETS}
    for _ in range(n_samples):
        selected = list(specialist_ids)
        for condition, pool in nonspecialists_by_list.items():
            indices = rng.choice(len(pool), size=draw_counts[condition], replace=False)
            selected.extend(pool[index] for index in indices)
        sample = pd.concat([grouped[participant] for participant in selected], ignore_index=True)
        audio = (
            sample.groupby("audio_identifier")
            .agg(
                voice_type=("voice_type", "first"),
                mean_mos=("mos_rating", "mean"),
                mean_eyetrackingmos=("eyetracking_mos", "mean"),
            )
            .reset_index()
        )
        for subset, (pearson, spearman) in _metrics(audio).items():
            samples[subset]["pearson"].append(pearson)
            samples[subset]["spearman"].append(spearman)

    rows = []
    for subset in SUBSETS:
        for metric, key in (("pearson_r", "pearson"), ("spearman_rho", "spearman")):
            values = np.asarray(samples[subset][key], float)
            values = values[np.isfinite(values)]
            rows.append(
                {
                    "subset": subset,
                    "n": SUBSET_N[subset],
                    "metric": metric,
                    "median": np.median(values),
                    "pct_2_5": np.percentile(values, 2.5),
                    "pct_97_5": np.percentile(values, 97.5),
                    "n_samples": len(values),
                }
            )
    result = pd.DataFrame(rows)
    result.attrs["specialists_by_list"] = {
        condition: len(values) for condition, values in specialists_by_list.items()
    }
    result.attrs["draw_counts"] = draw_counts
    return result


def write(df):
    common.ensure_dirs()
    path = os.path.join(common.OUTPUT_DIR, "balanced_2to1_correlations.csv")
    df.to_csv(path, index=False)
    return path
