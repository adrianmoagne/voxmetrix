"""Gaze quality table and quality-filtered sensitivity correlations."""
import os

import pandas as pd

from analysis import common, stats_correlations

MIN_RATE_HZ = 10.0
MIN_VALID_DWELL_PCT = 80.0


def quality_table(eyetracking):
    columns = [
        "participant",
        "condition",
        "audio_identifier",
        "voice_type",
        "speaker",
        "gaze_sample_count",
        "gaze_duration_ms",
        "gaze_sample_rate_hz",
        "gaze_sample_rate_hz_strict",
        "person_dwell_ms",
        "robot_dwell_ms",
        "off_dwell_ms",
        "total_observed_gaze_time_ms",
        "valid_dwell_pct",
    ]
    quality = eyetracking[columns].copy()
    quality["pass_rate"] = quality["gaze_sample_rate_hz"] >= MIN_RATE_HZ
    quality["pass_valid_dwell"] = quality["valid_dwell_pct"] >= MIN_VALID_DWELL_PCT
    quality["pass_quality"] = quality["pass_rate"] & quality["pass_valid_dwell"]
    return quality


def build(mos=None, eyetracking=None):
    mos = common.load_mos() if mos is None else mos
    eyetracking = common.load_eyetracking_trials() if eyetracking is None else eyetracking
    quality = quality_table(eyetracking)
    keep = quality[quality["pass_quality"]][["participant", "audio_identifier"]]
    et_keep = eyetracking.merge(keep, on=["participant", "audio_identifier"], how="inner")
    merged = pd.merge(
        mos[
            [
                "participant",
                "audio_identifier",
                "voice_type",
                "speaker",
                "condition",
                "mos_rating",
            ]
        ],
        et_keep[["participant", "audio_identifier", "eyetracking_mos"]],
        on=["participant", "audio_identifier"],
        how="inner",
    )
    audio = (
        merged.groupby("audio_identifier")
        .agg(
            voice_type=("voice_type", "first"),
            speaker=("speaker", "first"),
            mean_mos=("mos_rating", "mean"),
            mean_eyetrackingmos=("eyetracking_mos", "mean"),
        )
        .reset_index()
    )
    return quality, stats_correlations.build(audio), (len(et_keep), len(eyetracking))


def write(quality, sensitivity):
    common.ensure_dirs()
    p1 = os.path.join(common.OUTPUT_DIR, "gaze_quality_summary.csv")
    p2 = os.path.join(common.OUTPUT_DIR, "gaze_quality_sensitivity_correlations.csv")
    quality.to_csv(p1, index=False)
    sensitivity.to_csv(p2, index=False)
    return p1, p2
