"""Generate the paper-analysis figures from public data and regenerated tables."""
import os

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from matplotlib.patches import Patch

from analysis import common

COLORS = {"natural": "#1f4e8c", "synthetic": "#f05a36"}
SCATTER_COLORS = {"synthetic": "#4c72b0", "natural": "#dd8452"}
SAVE_DPI = 600


def _save(figure, name, *, bbox_inches=None):
    common.ensure_dirs()
    path = os.path.join(common.FIGURES_DIR, name)
    figure.savefig(path, dpi=SAVE_DPI, bbox_inches=bbox_inches)
    plt.close(figure)
    return path


def scatter(audio):
    figure, axis = plt.subplots(figsize=(3.55, 3.55))
    for voice_type in ("synthetic", "natural"):
        group = audio[audio["voice_type"] == voice_type]
        axis.scatter(
            group["mean_mos"],
            group["mean_eyetrackingmos"],
            s=30,
            alpha=0.9,
            label=voice_type,
            color=SCATTER_COLORS[voice_type],
            edgecolor="white",
            linewidth=0.35,
        )
    axis.plot([1, 5], [1, 5], "--", color="#777777", lw=1, label="perfect agreement")
    axis.set_xlabel("Mean Opinion Score (MOS)", fontsize=11)
    axis.set_ylabel("Eyetracking Mean Opinion Score\n(EyetrackingMOS)", fontsize=11)
    axis.set_xlim(1, 5.5)
    axis.set_ylim(1, 5.5)
    axis.set_aspect("equal")
    axis.set_xticks(np.arange(1, 5.6, 0.5))
    axis.set_yticks(np.arange(1, 5.6, 0.5))
    axis.grid(True, color="#c7c7c7", linewidth=0.8, alpha=0.75)
    axis.legend(
        loc="upper center",
        bbox_to_anchor=(0.5, 1.14),
        ncol=3,
        frameon=False,
        fontsize=8,
    )
    figure.tight_layout(pad=0.6)
    return _save(figure, "scatter_mos_vs_eyetrackingmos.pdf", bbox_inches="tight")


def _ranked(audio, column, label, filename):
    ranked = audio.sort_values(["mean_mos", "audio_identifier"], kind="stable").reset_index(
        drop=True
    )
    figure, axis = plt.subplots(figsize=(7.2, 5.2))
    x = np.arange(len(ranked))
    axis.bar(
        x,
        ranked[column],
        width=0.72,
        color=ranked["voice_type"].map(COLORS),
        edgecolor="white",
        linewidth=0.25,
    )
    ticks = np.arange(0, len(ranked), 6)
    axis.set_xlim(-0.5, len(ranked) - 0.5)
    axis.set_ylim(0, 5.1)
    axis.set_xticks(ticks)
    axis.set_xticklabels([str(index + 1) for index in ticks], rotation=90)
    axis.set_yticks(np.arange(0, 5.1, 0.5))
    axis.set_xlabel("Audio samples", fontsize=16)
    axis.set_ylabel(label, fontsize=16)
    axis.grid(axis="y", color="#c7c7c7")
    axis.set_axisbelow(True)
    figure.legend(
        handles=[
            Patch(facecolor=COLORS["natural"], label="Natural"),
            Patch(facecolor=COLORS["synthetic"], label="Synthetic"),
        ],
        loc="upper center",
        bbox_to_anchor=(0.5, 1.02),
        ncol=2,
        frameon=False,
        fontsize=14,
    )
    figure.tight_layout(pad=2, rect=[0, 0, 1, 0.96])
    return _save(figure, filename, bbox_inches="tight")


def ranked(audio):
    return [
        _ranked(audio, "mean_mos", "Mean Opinion Score (MOS)", "ranked_audio_mos.pdf"),
        _ranked(
            audio,
            "mean_eyetrackingmos",
            "Eyetracking Mean Opinion Score\n(EyetrackingMOS)",
            "ranked_audio_eyetrackingmos.pdf",
        ),
    ]


def confusion(audio):
    labels = [1, 2, 3, 4, 5]
    bins = [0.5, 1.5, 2.5, 3.5, 4.5, 5.5]
    table = pd.crosstab(
        pd.cut(audio["mean_mos"], bins=bins, labels=labels),
        pd.cut(audio["mean_eyetrackingmos"], bins=bins, labels=labels),
        dropna=False,
    ).reindex(index=labels, columns=labels, fill_value=0)
    figure, axis = plt.subplots(figsize=(6, 5))
    image = axis.imshow(table.values, cmap="Blues", origin="lower")
    axis.set_xticks(range(5), labels)
    axis.set_yticks(range(5), labels)
    axis.set_xlabel("EyetrackingMOS bin")
    axis.set_ylabel("MOS bin")
    axis.set_title("Audio score-bin agreement")
    for row in range(5):
        for column in range(5):
            value = table.values[row, column]
            if value:
                axis.text(column, row, str(value), ha="center", va="center")
    figure.colorbar(image, ax=axis, label="n audios")
    figure.tight_layout()
    return _save(figure, "confusion_score_bins.pdf")


def heatmaps(samples):
    samples = samples[samples["screen_half"] != "off_screen"]
    figure, axes = plt.subplots(2, 2, figsize=(10, 8))
    subsets = [
        (samples[samples["voice_type"] == "natural"], "voice: natural"),
        (samples[samples["voice_type"] == "synthetic"], "voice: synthetic"),
        (samples[samples["condition"] == "A"], "list: A"),
        (samples[samples["condition"] == "B"], "list: B"),
    ]
    for axis, (subset, title) in zip(axes.flat, subsets):
        histogram, _, _ = np.histogram2d(
            subset["norm_x"], subset["norm_y"], bins=60, range=[[0, 1], [0, 1]]
        )
        axis.imshow(
            histogram.T, origin="upper", extent=[0, 1, 1, 0], cmap="inferno", aspect="auto"
        )
        axis.axvline(0.5, color="white", ls="--", lw=0.8)
        axis.set_title(title)
        axis.set_xticks([])
        axis.set_yticks([])
    figure.suptitle("Gaze density (normalized screen; dashed = midline)")
    figure.tight_layout()
    return _save(figure, "gaze_heatmaps.pdf")


def dynamics(paired):
    figure, axis = plt.subplots(figsize=(12, 6))
    x = np.arange(len(paired))
    axis.bar(x - 0.2, paired["mean_natural"], 0.4, label="natural", color=COLORS["natural"])
    axis.bar(
        x + 0.2,
        paired["mean_synthetic"],
        0.4,
        label="synthetic",
        color=COLORS["synthetic"],
    )
    axis.set_xticks(x, paired["metric"], rotation=40, ha="right")
    axis.set_ylabel("participant-level mean")
    axis.set_title("Gaze dynamics: natural vs synthetic")
    axis.legend(frameon=False)
    figure.tight_layout()
    return _save(figure, "gaze_dynamics_natural_vs_synthetic.pdf")


def build(audio, paired, samples):
    return [
        scatter(audio),
        *ranked(audio),
        confusion(audio),
        heatmaps(samples),
        dynamics(paired),
    ]
