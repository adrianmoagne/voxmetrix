"""Convert layout-correct raw VoxMetrix result JSON into public data tables.

Public raw exports are expected to describe the rendered layout directly:
`presentation.presentedLeft` is the image shown on the left side of the screen.
"""
from __future__ import annotations

import gzip
import json
import math
import os
import re
import unicodedata
import urllib.parse
from collections import defaultdict
from typing import Any

import numpy as np
import pandas as pd

ROBOT_IMAGE_HINT = "robo"


def load_documents(path: str) -> list[dict[str, Any]]:
    """Load a JSON or JSON.gz export as a list of session documents."""
    opener = gzip.open if path.endswith(".gz") else open
    with opener(path, "rt", encoding="utf-8") as file:
        data = json.load(file)
    if isinstance(data, dict):
        return [data]
    if isinstance(data, list):
        return data
    raise ValueError(f"Expected {path} to contain a JSON object or array.")


def norm_email(value: Any) -> str:
    return str(value or "").strip().lower()


def norm_name(value: Any) -> str:
    text = str(value or "").strip().lower()
    text = unicodedata.normalize("NFKD", text)
    text = "".join(c for c in text if not unicodedata.combining(c))
    return re.sub(r"\s+", " ", text)


def pair_participants(
    mos_docs: list[dict[str, Any]],
    eyetracking_docs: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Pair participants across MOS and EyetrackingMOS exports.

    Matching is by unique normalized email first, then by unique normalized
    full name among the remaining documents. Output participant IDs are stable
    pseudonyms assigned in sorted match-key order.
    """

    def records(docs: list[dict[str, Any]]) -> list[dict[str, Any]]:
        return [
            {
                "doc": doc,
                "email": norm_email(doc.get("participantEmail")),
                "name": norm_name(doc.get("participantName")),
            }
            for doc in docs
        ]

    mos = records(mos_docs)
    eye = records(eyetracking_docs)
    mos_by_email = _unique_groups(mos, "email")
    eye_by_email = _unique_groups(eye, "email")

    matched_mos: set[int] = set()
    matched_eye: set[int] = set()
    pairs: list[tuple[dict[str, Any], dict[str, Any], str, str]] = []

    for email in sorted(set(mos_by_email) & set(eye_by_email)):
        m = mos_by_email[email]
        e = eye_by_email[email]
        pairs.append((m, e, "email", email))
        matched_mos.add(id(m))
        matched_eye.add(id(e))

    remaining_mos = [record for record in mos if id(record) not in matched_mos]
    remaining_eye = [record for record in eye if id(record) not in matched_eye]
    mos_by_name = _unique_groups(remaining_mos, "name")
    eye_by_name = _unique_groups(remaining_eye, "name")

    for name in sorted(set(mos_by_name) & set(eye_by_name)):
        m = mos_by_name[name]
        e = eye_by_name[name]
        pairs.append((m, e, "name", name))

    pairs.sort(key=lambda pair: pair[3])

    output = []
    for index, (mos_record, eye_record, match_by, _match_key) in enumerate(pairs, start=1):
        participant = f"P{index:02d}"
        condition = (
            mos_record["doc"].get("participantCondition")
            or eye_record["doc"].get("participantCondition")
        )
        output.append(
            {
                "participant": participant,
                "condition": condition,
                "match_by": match_by,
                "mos_doc": mos_record["doc"],
                "eyetracking_doc": eye_record["doc"],
                "mos_engine": mos_record["doc"].get("engine", "new"),
                "eyetracking_engine": eye_record["doc"].get("engine", "new"),
            }
        )
    return output


def _unique_groups(records: list[dict[str, Any]], key: str) -> dict[str, dict[str, Any]]:
    grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for record in records:
        value = record[key]
        if value:
            grouped[value].append(record)
    return {value: values[0] for value, values in grouped.items() if len(values) == 1}


def build_tables(
    mos_docs: list[dict[str, Any]],
    eyetracking_docs: list[dict[str, Any]],
) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    participants = pair_participants(mos_docs, eyetracking_docs)
    mos = build_mos_trials(participants)
    eye_trials, gaze_samples = build_eyetracking_trials(participants)
    calibration = build_calibration(participants)
    return mos, eye_trials, gaze_samples, calibration


def build_mos_trials(participants: list[dict[str, Any]]) -> pd.DataFrame:
    rows = []
    for participant in participants:
        for step in evaluation_steps(participant["mos_doc"]):
            src = (step.get("row", {}) or {}).get("values", {}).get("audio_src", "")
            rows.append(
                {
                    "participant": participant["participant"],
                    "condition": participant["condition"],
                    "engine": participant["mos_engine"],
                    "trial_index": (step.get("row", {}) or {}).get("index"),
                    "audio_identifier": audio_identifier(src),
                    "speaker": speaker(src),
                    "voice_type": voice_type(src),
                    "mos_rating": rating(step),
                    "rt_ms": (step.get("timing") or {}).get("durationMs"),
                }
            )
    return pd.DataFrame(rows).sort_values(["participant", "trial_index"]).reset_index(drop=True)


def rating(step: dict[str, Any]) -> int | None:
    for item in step.get("responseItems", []) or []:
        if item.get("kind") == "RatingScale":
            index = item.get("selectedIndex")
            if index is not None:
                return int(index) + 1
            value = item.get("value")
            if value:
                try:
                    return int(str(value).strip()[0])
                except (IndexError, ValueError):
                    return None
    return None


def build_eyetracking_trials(
    participants: list[dict[str, Any]],
) -> tuple[pd.DataFrame, pd.DataFrame]:
    trial_rows = []
    sample_rows = []
    for participant in participants:
        doc = participant["eyetracking_doc"]
        browser = doc.get("browserInfo", {}) or {}
        width = float(browser.get("windowWidth") or 0) or 1.0
        height = float(browser.get("windowHeight") or 0) or 1.0

        for step in evaluation_steps(doc):
            src = (step.get("row", {}) or {}).get("values", {}).get("audio_src", "")
            gaze = trial_gaze(step, width, height)
            t = gaze["t"]
            n_samples = len(t)
            dwell = dwell_by_aoi(t, gaze["aoi"])
            valid = dwell["person"] + dwell["robot"]
            total = valid + dwell["off_screen"]
            duration = (t[-1] - t[0]) if n_samples >= 2 else 0.0
            pct = person_gaze_pct(dwell)
            rate = (n_samples / (duration / 1000.0)) if duration > 0 else np.nan
            rate_strict = ((n_samples - 1) / (duration / 1000.0)) if duration > 0 else np.nan
            person_box = gaze["person_box"] or {}
            robot_box = gaze["robot_box"] or {}

            trial_rows.append(
                {
                    "participant": participant["participant"],
                    "condition": participant["condition"],
                    "engine": participant["eyetracking_engine"],
                    "trial_index": (step.get("row", {}) or {}).get("index"),
                    "audio_identifier": audio_identifier(src),
                    "speaker": speaker(src),
                    "voice_type": voice_type(src),
                    "window_width": width,
                    "window_height": height,
                    "person_side": gaze["person_side"],
                    "robot_side": gaze["robot_side"],
                    "gaze_sample_count": n_samples,
                    "gaze_duration_ms": duration,
                    "person_dwell_ms": dwell["person"],
                    "robot_dwell_ms": dwell["robot"],
                    "off_dwell_ms": dwell["off_screen"],
                    "total_observed_gaze_time_ms": total,
                    "person_gaze_pct": pct,
                    "eyetracking_mos": eyetracking_mos(pct),
                    "gaze_sample_rate_hz": rate,
                    "gaze_sample_rate_hz_strict": rate_strict,
                    "valid_dwell_pct": (valid / total * 100.0) if total > 0 else np.nan,
                    "person_box_left": person_box.get("left"),
                    "person_box_top": person_box.get("top"),
                    "person_box_right": person_box.get("right"),
                    "person_box_bottom": person_box.get("bottom"),
                    "robot_box_left": robot_box.get("left"),
                    "robot_box_top": robot_box.get("top"),
                    "robot_box_right": robot_box.get("right"),
                    "robot_box_bottom": robot_box.get("bottom"),
                }
            )

            screen_diag = math.hypot(width, height)
            for index in range(n_samples):
                sample_rows.append(
                    {
                        "participant": participant["participant"],
                        "condition": participant["condition"],
                        "engine": participant["eyetracking_engine"],
                        "audio_identifier": audio_identifier(src),
                        "voice_type": voice_type(src),
                        "trial_index": (step.get("row", {}) or {}).get("index"),
                        "t_ms": t[index],
                        "audio_time_s": gaze["audio_time"][index],
                        "x": gaze["x"][index],
                        "y": gaze["y"][index],
                        "norm_x": gaze["x"][index] / width,
                        "norm_y": gaze["y"][index] / height,
                        "screen_half": gaze["half"][index],
                        "aoi": gaze["aoi"][index],
                        "aoi_bbox": gaze["aoi_bbox"][index],
                        "screen_diag": screen_diag,
                        "person_box_left": person_box.get("left"),
                        "person_box_top": person_box.get("top"),
                        "person_box_right": person_box.get("right"),
                        "person_box_bottom": person_box.get("bottom"),
                        "robot_box_left": robot_box.get("left"),
                        "robot_box_top": robot_box.get("top"),
                        "robot_box_right": robot_box.get("right"),
                        "robot_box_bottom": robot_box.get("bottom"),
                    }
                )

    return pd.DataFrame(trial_rows), pd.DataFrame(sample_rows)


def trial_gaze(step: dict[str, Any], width: float, height: float) -> dict[str, Any]:
    person_side, robot_side = person_robot_sides(step)
    side_to_aoi = {person_side: "person", robot_side: "robot", "off_screen": "off_screen"}
    person_box, robot_box = person_robot_boxes(step, person_side)

    samples = []
    for gaze in (step.get("extras", {}) or {}).get("gazeData", []) or []:
        x = gaze.get("x")
        y = gaze.get("y")
        timestamp = gaze.get("t")
        if gaze.get("audioTime") is None:
            continue
        if not (_finite(x) and _finite(y) and _finite(timestamp)):
            continue
        half = screen_half(float(x), float(y), width, height)
        samples.append(
            (
                float(timestamp),
                float(x),
                float(y),
                gaze.get("audioTime"),
                half,
                side_to_aoi[half],
                aoi_by_box(float(x), float(y), person_box, robot_box),
            )
        )
    samples.sort(key=lambda sample: sample[0])
    return {
        "person_side": person_side,
        "robot_side": robot_side,
        "person_box": person_box,
        "robot_box": robot_box,
        "t": np.array([sample[0] for sample in samples], dtype=float),
        "x": np.array([sample[1] for sample in samples], dtype=float),
        "y": np.array([sample[2] for sample in samples], dtype=float),
        "audio_time": np.array([sample[3] for sample in samples], dtype=float),
        "half": [sample[4] for sample in samples],
        "aoi": [sample[5] for sample in samples],
        "aoi_bbox": [sample[6] for sample in samples],
    }


def _finite(value: Any) -> bool:
    return value is not None and isinstance(value, (int, float)) and math.isfinite(value)


def screen_half(x: float, y: float, width: float, height: float) -> str:
    if x < 0 or x > width or y < 0 or y > height:
        return "off_screen"
    return "left" if x < width / 2 else "right"


def person_robot_sides(step: dict[str, Any]) -> tuple[str, str]:
    presented_left = str((step.get("presentation", {}) or {}).get("presentedLeft") or "").lower()
    if presented_left:
        person_side = "right" if ROBOT_IMAGE_HINT in presented_left else "left"
    else:
        swapped = bool((step.get("presentation", {}) or {}).get("swapped"))
        person_side = "right" if swapped else "left"
    robot_side = "left" if person_side == "right" else "right"
    return person_side, robot_side


def person_robot_boxes(
    step: dict[str, Any],
    person_side: str,
) -> tuple[dict[str, float] | None, dict[str, float] | None]:
    boxes = [
        target.get("boundingBox")
        for target in (step.get("extras", {}) or {}).get("targetBoundingBoxes", []) or []
        if target.get("boundingBox")
    ]
    if len(boxes) != 2:
        return None, None
    boxes = sorted(boxes, key=lambda box: (box["left"] + box["right"]) / 2.0)
    left_box = _box(boxes[0])
    right_box = _box(boxes[1])
    if person_side == "left":
        return left_box, right_box
    return right_box, left_box


def _box(box: dict[str, Any]) -> dict[str, float]:
    return {
        "left": float(box["left"]),
        "top": float(box["top"]),
        "right": float(box["right"]),
        "bottom": float(box["bottom"]),
    }


def aoi_by_box(
    x: float,
    y: float,
    person_box: dict[str, float] | None,
    robot_box: dict[str, float] | None,
) -> str:
    if point_in_box(x, y, person_box):
        return "person"
    if point_in_box(x, y, robot_box):
        return "robot"
    return "off_aoi"


def point_in_box(x: float, y: float, box: dict[str, float] | None) -> bool:
    return bool(
        box is not None
        and box["left"] <= x <= box["right"]
        and box["top"] <= y <= box["bottom"]
    )


def dwell_by_aoi(timestamps: np.ndarray, aoi: list[str]) -> dict[str, float]:
    dwell = {"person": 0.0, "robot": 0.0, "off_screen": 0.0}
    for index in range(len(timestamps) - 1):
        dwell[aoi[index]] += timestamps[index + 1] - timestamps[index]
    return dwell


def person_gaze_pct(dwell: dict[str, float]) -> float:
    denominator = dwell["person"] + dwell["robot"]
    return (dwell["person"] / denominator * 100.0) if denominator > 0 else np.nan


def eyetracking_mos(percent: float) -> float:
    if percent is None or (isinstance(percent, float) and math.isnan(percent)):
        return np.nan
    if percent <= 20:
        return 1
    if percent <= 40:
        return 2
    if percent <= 60:
        return 3
    if percent <= 80:
        return 4
    return 5


def build_calibration(participants: list[dict[str, Any]]) -> pd.DataFrame:
    rows = []
    for participant in participants:
        calibration = participant["eyetracking_doc"].get("calibrationData") or {}
        recalibration = calibration.get("recalibration_performed")
        for phase in ("initial_validation", "final_validation"):
            validation = calibration.get(phase) or {}
            offsets = validation.get("average_offset") or []
            percent_in_roi = validation.get("percent_in_roi") or []
            for index in range(max(len(offsets), len(percent_in_roi))):
                offset = offsets[index] if index < len(offsets) and isinstance(offsets[index], dict) else {}
                rows.append(
                    {
                        "participant": participant["participant"],
                        "condition": participant["condition"],
                        "engine": participant["eyetracking_engine"],
                        "phase": phase,
                        "target_index": index + 1,
                        "average_offset_x": offset.get("x"),
                        "average_offset_y": offset.get("y"),
                        "percent_in_roi": (
                            percent_in_roi[index] if index < len(percent_in_roi) else np.nan
                        ),
                        "recalibration_performed": recalibration,
                    }
                )
    return pd.DataFrame(rows)


def evaluation_steps(doc: dict[str, Any]) -> list[dict[str, Any]]:
    return [
        step
        for step in doc.get("steps", []) or []
        if (step.get("block", {}) or {}).get("name") == "evaluation"
    ]


def audio_basename(url: Any) -> str:
    if not url:
        return ""
    path = urllib.parse.urlparse(str(url)).path
    return urllib.parse.unquote(os.path.basename(path))


def audio_identifier(url: Any) -> str:
    return re.sub(r"\.wav$", "", audio_basename(url), flags=re.IGNORECASE)


def voice_type(url: Any) -> str:
    base = audio_basename(url).lower()
    if "-gt" in base:
        return "natural"
    if "syntacc" in base:
        return "synthetic"
    return "unknown"


def speaker(url: Any) -> str:
    base = audio_basename(url).lower()
    match = re.search(r"(br[a-z]{2}-\d+)", base)
    return match.group(1) if match else audio_identifier(url)
