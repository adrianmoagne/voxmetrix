"""Audio-level correlations with speaker-cluster bootstrap intervals."""
import os

import numpy as np
import pandas as pd
from scipy import stats

from analysis import common, scores

N_BOOT = 5000
SEED = 12345


def point_metrics(x, y):
    x, y = np.asarray(x, float), np.asarray(y, float)
    if len(x) >= 3 and np.std(x) > 0 and np.std(y) > 0:
        pearson_r, pearson_p = stats.pearsonr(x, y)
        spearman_rho, spearman_p = stats.spearmanr(x, y)
    else:
        pearson_r = pearson_p = spearman_rho = spearman_p = np.nan
    diff = x - y
    return {
        "pearson_r": pearson_r,
        "pearson_p": pearson_p,
        "spearman_rho": spearman_rho,
        "spearman_p": spearman_p,
        "r2": pearson_r**2 if np.isfinite(pearson_r) else np.nan,
        "mse": float(np.mean(diff**2)),
        "rmse": float(np.sqrt(np.mean(diff**2))),
        "mae": float(np.mean(np.abs(diff))),
        "n": len(x),
    }


def cluster_bootstrap(df, xcol, ycol, cluster_col="speaker", n_boot=N_BOOT, seed=SEED):
    rng = np.random.default_rng(seed)
    clusters = df[cluster_col].unique()
    grouped = {cluster: df[df[cluster_col] == cluster] for cluster in clusters}
    samples = {key: [] for key in ("pearson_r", "spearman_rho", "rmse", "r2")}
    for _ in range(n_boot):
        selected = rng.choice(clusters, size=len(clusters), replace=True)
        sample = pd.concat([grouped[c] for c in selected], ignore_index=True)
        metrics = point_metrics(
            sample[xcol],
            sample[ycol],
        )
        for key in samples:
            samples[key].append(metrics[key])
    return {
        key: tuple(np.percentile(np.asarray(values)[np.isfinite(values)], [2.5, 97.5]))
        for key, values in samples.items()
    }


def _rows(label, df, xcol, ycol):
    metrics = point_metrics(df[xcol], df[ycol])
    intervals = cluster_bootstrap(df, xcol, ycol)
    rows = []
    for metric in ("pearson_r", "spearman_rho", "r2", "rmse", "mse", "mae"):
        low, high = intervals.get(metric, (np.nan, np.nan))
        p_value = (
            metrics["pearson_p"]
            if metric == "pearson_r"
            else metrics["spearman_p"] if metric == "spearman_rho" else np.nan
        )
        rows.append(
            {
                "subset": label,
                "metric": metric,
                "value": metrics[metric],
                "ci_low": low,
                "ci_high": high,
                "p_value": p_value,
                "n_audios": metrics["n"],
            }
        )
    return rows


def build(audio=None):
    audio = scores.build()[1] if audio is None else audio
    rows = _rows("all", audio, "mean_mos", "mean_eyetrackingmos")
    for voice_type in ("natural", "synthetic"):
        rows += _rows(
            voice_type,
            audio[audio["voice_type"] == voice_type],
            "mean_mos",
            "mean_eyetrackingmos",
        )
    adjusted = audio.copy()
    adjusted["mos_adj"] = adjusted["mean_mos"] - adjusted.groupby("voice_type")[
        "mean_mos"
    ].transform("mean")
    adjusted["et_adj"] = adjusted["mean_eyetrackingmos"] - adjusted.groupby("voice_type")[
        "mean_eyetrackingmos"
    ].transform("mean")
    rows += _rows("voice_adjusted", adjusted, "mos_adj", "et_adj")
    return pd.DataFrame(rows)


def write(df):
    common.ensure_dirs()
    path = os.path.join(common.OUTPUT_DIR, "correlations.csv")
    df.to_csv(path, index=False)
    return path
