"""Paper figures. Called from run_all.py; each function saves one PDF."""
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from matplotlib.patches import Patch

COLORS = {"natural": "#1f4e8c", "synthetic": "#f05a36"}
SCATTER_COLORS = {"synthetic": "#4c72b0", "natural": "#dd8452"}
DPI = 600


def save(fig, path, tight=False):
    fig.savefig(path, dpi=DPI, bbox_inches="tight" if tight else None)
    plt.close(fig)


def scatter(audio, path):
    """Mean EyetrackingMOS against mean MOS, one point per audio."""
    fig, ax = plt.subplots(figsize=(3.55, 3.55))
    for voice_type in ("synthetic", "natural"):
        g = audio[audio["voice_type"] == voice_type]
        ax.scatter(g["mean_mos"], g["mean_eyetrackingmos"], s=30, alpha=0.9, label=voice_type, color=SCATTER_COLORS[voice_type], edgecolor="white", linewidth=0.35)
    ax.plot([1, 5], [1, 5], "--", color="#777777", lw=1, label="perfect agreement")
    ax.set_xlabel("Mean Opinion Score (MOS)", fontsize=11)
    ax.set_ylabel("Eyetracking Mean Opinion Score\n(EyetrackingMOS)", fontsize=11)
    ax.set_xlim(1, 5.5)
    ax.set_ylim(1, 5.5)
    ax.set_aspect("equal")
    ax.set_xticks(np.arange(1, 5.6, 0.5))
    ax.set_yticks(np.arange(1, 5.6, 0.5))
    ax.grid(True, color="#c7c7c7", linewidth=0.8, alpha=0.75)
    ax.legend(loc="upper center", bbox_to_anchor=(0.5, 1.14), ncol=3, frameon=False, fontsize=8)
    fig.tight_layout(pad=0.6)
    save(fig, path, tight=True)


def ranked_bars(audio, column, ylabel, path):
    """All audios sorted by mean MOS, bar height = `column`, colour = voice type."""
    ranked = audio.sort_values(["mean_mos", "audio_identifier"], kind="stable").reset_index(drop=True)
    fig, ax = plt.subplots(figsize=(7.2, 5.2))
    x = np.arange(len(ranked))
    ax.bar(x, ranked[column], width=0.72, color=ranked["voice_type"].map(COLORS), edgecolor="white", linewidth=0.25)
    ranks = np.arange(20, len(ranked) + 1, 20)  # label every 20th audio: 20, 40, ...
    ax.set_xlim(-0.5, len(ranked) - 0.5)
    ax.set_ylim(0, 5.1)
    ax.set_xticks(ranks - 1, [str(r) for r in ranks], fontsize=25)
    ax.set_yticks(range(0, 6, 1), [str(v) for v in range(0, 6, 1)], fontsize=25)
    ax.set_xlabel("Audio samples", fontsize=25)
    ax.set_ylabel(ylabel, fontsize=25)
    ax.grid(axis="y", color="#c7c7c7")
    ax.set_axisbelow(True)
    handles = [Patch(facecolor=COLORS["synthetic"], label="Synthetic"), Patch(facecolor=COLORS["natural"], label="Natural")]
    ax.legend(handles=handles, bbox_to_anchor=(0.5, 1.0), loc="lower center", ncol=2, borderaxespad=0.0, borderpad=0.05, fontsize=25, frameon=False, columnspacing=3)
    fig.tight_layout()
    save(fig, path, tight=True)


def confusion(audio, path):
    """How often the rounded MOS bin and rounded EyetrackingMOS bin agree."""
    labels = [1, 2, 3, 4, 5]
    edges = [0.5, 1.5, 2.5, 3.5, 4.5, 5.5]
    table = pd.crosstab(pd.cut(audio["mean_mos"], edges, labels=labels), pd.cut(audio["mean_eyetrackingmos"], edges, labels=labels), dropna=False)
    table = table.reindex(index=labels, columns=labels, fill_value=0)
    fig, ax = plt.subplots(figsize=(6, 5))
    image = ax.imshow(table.values, cmap="Blues", origin="lower")
    ax.set_xticks(range(5), labels)
    ax.set_yticks(range(5), labels)
    ax.set_xlabel("EyetrackingMOS bin")
    ax.set_ylabel("MOS bin")
    ax.set_title("Audio score-bin agreement")
    for i in range(5):
        for j in range(5):
            if table.values[i, j]:
                ax.text(j, i, str(table.values[i, j]), ha="center", va="center")
    fig.colorbar(image, ax=ax, label="n audios")
    fig.tight_layout()
    save(fig, path)


def heatmaps(samples, path):
    """Where on the (normalized) screen people looked, split by voice type and by list."""
    samples = samples[samples["aoi"] != "off_screen"]
    fig, axes = plt.subplots(2, 2, figsize=(10, 8))
    panels = [
        (samples[samples["voice_type"] == "natural"], "voice: natural"),
        (samples[samples["voice_type"] == "synthetic"], "voice: synthetic"),
        (samples[samples["condition"] == "A"], "list: A"),
        (samples[samples["condition"] == "B"], "list: B"),
    ]
    for ax, (subset, title) in zip(axes.flat, panels):
        counts, _, _ = np.histogram2d(subset["norm_x"], subset["norm_y"], bins=60, range=[[0, 1], [0, 1]])
        ax.imshow(counts.T, origin="upper", extent=[0, 1, 1, 0], cmap="inferno", aspect="auto")
        ax.axvline(0.5, color="white", ls="--", lw=0.8)
        ax.set_title(title)
        ax.set_xticks([])
        ax.set_yticks([])
    fig.suptitle("Gaze density (normalized screen; dashed = midline)")
    fig.tight_layout()
    save(fig, path)


def dynamics(paired, path):
    """Participant-level means of each gaze-dynamics metric, natural vs synthetic."""
    fig, ax = plt.subplots(figsize=(12, 6))
    x = np.arange(len(paired))
    ax.bar(x - 0.2, paired["mean_natural"], 0.4, label="natural", color=COLORS["natural"])
    ax.bar(x + 0.2, paired["mean_synthetic"], 0.4, label="synthetic", color=COLORS["synthetic"])
    ax.set_xticks(x, paired["metric"], rotation=40, ha="right")
    ax.set_ylabel("participant-level mean")
    ax.set_title("Gaze dynamics: natural vs synthetic")
    ax.legend(frameon=False)
    fig.tight_layout()
    save(fig, path)


def make_all(audio, paired, samples, out_dir):
    out_dir.mkdir(parents=True, exist_ok=True)
    scatter(audio, out_dir / "scatter_mos_vs_eyetrackingmos.pdf")
    ranked_bars(audio, "mean_mos", "MOS", out_dir / "ranked_audio_mos.pdf")
    ranked_bars(audio, "mean_eyetrackingmos", "EyeTrackingMOS", out_dir / "ranked_audio_eyetrackingmos.pdf")
    confusion(audio, out_dir / "confusion_score_bins.pdf")
    heatmaps(samples, out_dir / "gaze_heatmaps.pdf")
    dynamics(paired, out_dir / "gaze_dynamics_natural_vs_synthetic.pdf")
