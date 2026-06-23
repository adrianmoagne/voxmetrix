"""Build participant/audio and audio-level MOS–EyetrackingMOS tables."""
import os

import pandas as pd

from analysis import common


def build(mos=None, eyetracking=None):
    mos = common.load_mos() if mos is None else mos
    eyetracking = common.load_eyetracking_trials() if eyetracking is None else eyetracking
    keys = ["participant", "audio_identifier"]
    merged = pd.merge(
        mos[keys + ["voice_type", "speaker", "condition", "mos_rating"]],
        eyetracking[keys + ["eyetracking_mos", "person_gaze_pct"]],
        on=keys,
        how="inner",
    )
    participant_audio = merged.rename(
        columns={
            "voice_type": "type",
            "mos_rating": "score_mos",
            "eyetracking_mos": "score_eyetrackingmos",
        }
    )[["participant", "audio_identifier", "type", "score_mos", "score_eyetrackingmos"]]
    audio = (
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
    return participant_audio, audio, merged


def write(participant_audio, audio):
    common.ensure_dirs()
    p1 = os.path.join(common.OUTPUT_DIR, "participant_audio_scores.csv")
    p2 = os.path.join(common.OUTPUT_DIR, "audio_level_comparison.csv")
    participant_audio.to_csv(p1, index=False)
    audio.to_csv(p2, index=False)
    return p1, p2
