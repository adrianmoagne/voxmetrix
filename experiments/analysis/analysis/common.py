"""Paths, public-data loading, validation, and shared metadata helpers."""
from __future__ import annotations

import os
import re

import pandas as pd

ANALYSIS_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXPERIMENTS_DIR = os.path.dirname(ANALYSIS_DIR)
DATA_DIR = os.path.join(EXPERIMENTS_DIR, "data")
OUTPUT_DIR = os.path.join(ANALYSIS_DIR, "output")
FIGURES_DIR = os.path.join(OUTPUT_DIR, "figures")

MOS_PATH = os.path.join(DATA_DIR, "mos_trials.csv")
ET_PATH = os.path.join(DATA_DIR, "eyetracking_trials.csv")
GAZE_PATH = os.path.join(DATA_DIR, "eyetracking_gaze_samples.csv.gz")
SPECIALISTS_PATH = os.path.join(DATA_DIR, "specialist_participants.csv")


def ensure_dirs() -> None:
    os.makedirs(FIGURES_DIR, exist_ok=True)


def load_mos() -> pd.DataFrame:
    return pd.read_csv(MOS_PATH)


def load_eyetracking_trials() -> pd.DataFrame:
    return pd.read_csv(ET_PATH)


def load_gaze_samples() -> pd.DataFrame:
    return pd.read_csv(GAZE_PATH)


def load_specialists() -> pd.DataFrame:
    return pd.read_csv(SPECIALISTS_PATH)


def speaker(audio_identifier: str) -> str:
    match = re.search(r"(br[a-z]{2}-\d+)", str(audio_identifier).lower())
    return match.group(1) if match else str(audio_identifier)


def validate_public_data(
    mos: pd.DataFrame,
    eyetracking: pd.DataFrame,
    gaze: pd.DataFrame | None = None,
) -> None:
    expected_trials = 61 * 60
    if len(mos) != expected_trials or len(eyetracking) != expected_trials:
        raise ValueError("Expected 3,660 MOS and 3,660 eye-tracking trials.")

    keys = ["participant", "audio_identifier"]
    if mos.duplicated(keys).any() or eyetracking.duplicated(keys).any():
        raise ValueError("Duplicate participant/audio trials found.")

    mos_keys = set(map(tuple, mos[keys].to_numpy()))
    et_keys = set(map(tuple, eyetracking[keys].to_numpy()))
    if mos_keys != et_keys:
        raise ValueError("MOS and eye-tracking trial keys do not match.")

    participants = sorted(mos["participant"].unique())
    if len(participants) != 61 or any(not re.fullmatch(r"P\d{2}", p) for p in participants):
        raise ValueError("Unexpected participant identifiers.")

    if gaze is not None:
        gaze_participants = set(gaze["participant"].unique())
        if gaze_participants != set(participants):
            raise ValueError("Gaze samples and trial data contain different participants.")
