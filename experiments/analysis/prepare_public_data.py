"""Turn anonymized raw VoxMetrix result exports into the public CSV tables.

    python3 prepare_public_data.py \
        --mos-results ../raw/mos_results.anonymized.json.gz \
        --eyetracking-results ../raw/eyetracking_results.anonymized.json.gz \
        --out-dir ../data

Each export is a list of session documents, one per participant. A session has
`steps`; the ones in the "evaluation" block are the trials. Participants are
paired across the two experiments by e-mail (then by name) and renamed P01, P02...

Gaze timing uses the audio player's clock: every gaze sample carries `audioTime`,
the clip position in seconds when the sample was taken. Samples without it (the
player was not running) are dropped. See gaze.py.
"""
import argparse
import gzip
import hashlib
import json
import math
import os
import re
import unicodedata
from pathlib import Path
from urllib.parse import unquote, urlparse

import numpy as np
import pandas as pd

import gaze

HERE = Path(__file__).resolve().parent
RAW_DIR = HERE.parent / "raw"
DATA_DIR = HERE.parent / "data"


# ----------------------------------------------------------------------------- raw documents


def load_documents(path):
    opener = gzip.open if str(path).endswith(".gz") else open
    with opener(path, "rt", encoding="utf-8") as f:
        docs = json.load(f)
    return docs if isinstance(docs, list) else [docs]


def norm_email(value):
    return str(value or "").strip().lower()


def norm_name(value):
    text = unicodedata.normalize("NFKD", str(value or "").strip().lower())
    text = "".join(c for c in text if not unicodedata.combining(c))
    return re.sub(r"\s+", " ", text)


def pair_participants(mos_docs, et_docs):
    """Match each MOS session to an eye-tracking session of the same person.

    A key (e-mail, then name) is only used when it identifies exactly one session
    on each side. Pairs are sorted by key and renamed P01, P02, ...
    """

    def unique_by(docs, key_fn):
        groups = {}
        for doc in docs:
            key = key_fn(doc)
            if key:
                groups.setdefault(key, []).append(doc)
        return {key: docs[0] for key, docs in groups.items() if len(docs) == 1}

    by_email = lambda doc: norm_email(doc.get("participantEmail"))
    by_name = lambda doc: norm_name(doc.get("participantName"))

    pairs = []
    mos_by, et_by = unique_by(mos_docs, by_email), unique_by(et_docs, by_email)
    for key in sorted(set(mos_by) & set(et_by)):
        pairs.append((key, mos_by[key], et_by[key]))

    used = {id(doc) for _, m, e in pairs for doc in (m, e)}
    mos_left = [d for d in mos_docs if id(d) not in used]
    et_left = [d for d in et_docs if id(d) not in used]
    mos_by, et_by = unique_by(mos_left, by_name), unique_by(et_left, by_name)
    for key in sorted(set(mos_by) & set(et_by)):
        pairs.append((key, mos_by[key], et_by[key]))

    pairs.sort(key=lambda p: p[0])
    participants = []
    for i, (_, mos_doc, et_doc) in enumerate(pairs, start=1):
        participants.append(
            {
                "participant": f"P{i:02d}",
                "condition": mos_doc.get("participantCondition") or et_doc.get("participantCondition"),
                "mos_doc": mos_doc,
                "et_doc": et_doc,
            }
        )
    return participants


def trials(doc):
    return [s for s in doc.get("steps") or [] if (s.get("block") or {}).get("name") == "evaluation"]


def row_values(step):
    return (step.get("row") or {}).get("values") or {}


def row_index(step):
    return (step.get("row") or {}).get("index")


# ----------------------------------------------------------------------------- stimulus names


def audio_identifier(src):
    """'https://host/tts/foo%20bar.wav' -> 'foo bar'."""
    name = unquote(os.path.basename(urlparse(str(src or "")).path))
    return re.sub(r"\.wav$", "", name, flags=re.IGNORECASE)


def voice_type(src):
    name = audio_identifier(src).lower()
    if "-gt" in name:
        return "natural"
    if "syntacc" in name:
        return "synthetic"
    return "unknown"


def speaker(src):
    match = re.search(r"(br[a-z]{2}-\d+)", audio_identifier(src).lower())
    return match.group(1) if match else audio_identifier(src)


# ----------------------------------------------------------------------------- MOS trials


def mos_rating(step):
    for item in step.get("responseItems") or []:
        if item.get("kind") == "RatingScale" and item.get("selectedIndex") is not None:
            return int(item["selectedIndex"]) + 1
    return None


def build_mos_trials(participants):
    rows = []
    for p in participants:
        for step in trials(p["mos_doc"]):
            src = row_values(step).get("audio_src", "")
            rows.append(
                {
                    "participant": p["participant"],
                    "condition": p["condition"],
                    "engine": p["mos_doc"].get("engine", "new"),
                    "trial_index": row_index(step),
                    "audio_identifier": audio_identifier(src),
                    "speaker": speaker(src),
                    "voice_type": voice_type(src),
                    "mos_rating": mos_rating(step),
                    "rt_ms": (step.get("timing") or {}).get("durationMs"),
                }
            )
    return pd.DataFrame(rows).sort_values(["participant", "trial_index"]).reset_index(drop=True)


# ----------------------------------------------------------------------------- eye-tracking trials


def person_side(step):
    """Which half of the screen showed the person. `presentedLeft` names the left image."""
    left = str((step.get("presentation") or {}).get("presentedLeft") or "").lower()
    if left:
        return "right" if "robo" in left else "left"
    return "right" if (step.get("presentation") or {}).get("swapped") else "left"


def image_boxes(step, side):
    """(person_box, robot_box) as dicts with left/top/right/bottom, or (None, None)."""
    boxes = [t.get("boundingBox") for t in (step.get("extras") or {}).get("targetBoundingBoxes") or []]
    boxes = [b for b in boxes if b]
    if len(boxes) != 2:
        return None, None
    left, right = sorted(boxes, key=lambda b: (b["left"] + b["right"]) / 2)
    return (left, right) if side == "left" else (right, left)


def in_box(x, y, box):
    return box is not None and box["left"] <= x <= box["right"] and box["top"] <= y <= box["bottom"]


def trial_samples(step, width, height):
    """Gaze samples of one trial as a DataFrame sorted by time, with AOI labels."""
    side = person_side(step)
    person_box, robot_box = image_boxes(step, side)
    rows = []
    for g in (step.get("extras") or {}).get("gazeData") or []:
        x, y, t, audio_time = g.get("x"), g.get("y"), g.get("t"), g.get("audioTime")
        if audio_time is None or not all(isinstance(v, (int, float)) and math.isfinite(v) for v in (x, y, t)):
            continue
        if x < 0 or x > width or y < 0 or y > height:
            aoi = "off_screen"
        elif (x < width / 2) == (side == "left"):
            aoi = "person"
        else:
            aoi = "robot"
        aoi_bbox = "person" if in_box(x, y, person_box) else "robot" if in_box(x, y, robot_box) else "off_aoi"
        rows.append({"t_ms": float(t), "audio_time_s": float(audio_time), "x": float(x), "y": float(y), "aoi": aoi, "aoi_bbox": aoi_bbox})
    samples = pd.DataFrame(rows, columns=["t_ms", "audio_time_s", "x", "y", "aoi", "aoi_bbox"])
    return samples.sort_values("t_ms", kind="stable").reset_index(drop=True), side, person_box, robot_box


def build_eyetracking_trials(participants):
    trial_rows, sample_frames = [], []
    for p in participants:
        doc = p["et_doc"]
        browser = doc.get("browserInfo") or {}
        width = float(browser.get("windowWidth") or 1)
        height = float(browser.get("windowHeight") or 1)
        for step in trials(doc):
            src = row_values(step).get("audio_src", "")
            samples, side, person_box, robot_box = trial_samples(step, width, height)
            durations = gaze.sample_durations(samples["audio_time_s"].to_numpy())
            covered_s = float(durations.sum())
            dwell_s = gaze.dwell(durations, samples["aoi"])
            on_screen_s = dwell_s["person"] + dwell_s["robot"]
            pct = gaze.person_gaze_pct(dwell_s)
            trial = {
                "participant": p["participant"],
                "condition": p["condition"],
                "engine": doc.get("engine", "new"),
                "trial_index": row_index(step),
                "audio_identifier": audio_identifier(src),
                "speaker": speaker(src),
                "voice_type": voice_type(src),
                "window_width": width,
                "window_height": height,
                "person_side": side,
                "gaze_sample_count": len(samples),
                "audio_time_covered_s": covered_s,
                "person_dwell_s": dwell_s["person"],
                "robot_dwell_s": dwell_s["robot"],
                "off_screen_dwell_s": dwell_s["off_screen"],
                "valid_dwell_pct": 100 * on_screen_s / covered_s if covered_s > 0 else np.nan,
                "person_gaze_pct": pct,
                "eyetracking_mos": gaze.eyetracking_mos(pct),
                "gaze_sample_rate_hz": len(samples) / covered_s if covered_s > 0 else np.nan,
            }
            for name, box in (("person_box", person_box), ("robot_box", robot_box)):
                for edge in ("left", "top", "right", "bottom"):
                    trial[f"{name}_{edge}"] = box[edge] if box else None
            trial_rows.append(trial)

            samples.insert(0, "participant", p["participant"])
            samples.insert(1, "condition", p["condition"])
            samples.insert(2, "engine", doc.get("engine", "new"))
            samples.insert(3, "audio_identifier", audio_identifier(src))
            samples.insert(4, "voice_type", voice_type(src))
            samples.insert(5, "trial_index", row_index(step))
            samples["norm_x"] = samples["x"] / width
            samples["norm_y"] = samples["y"] / height
            samples["screen_diag"] = math.hypot(width, height)
            sample_frames.append(samples)

    et = pd.DataFrame(trial_rows)
    samples = pd.concat(sample_frames, ignore_index=True)
    # Clip length: the player clamps audioTime at the clip's end, so the largest
    # value ever recorded for an audio is its duration (as long as someone heard it through).
    duration = samples.groupby("audio_identifier")["audio_time_s"].max()
    et["audio_duration_s"] = et["audio_identifier"].map(duration)
    et["audio_coverage_pct"] = 100 * et["audio_time_covered_s"] / et["audio_duration_s"]
    return et, samples


# ----------------------------------------------------------------------------- calibration


def build_calibration(participants):
    rows = []
    for p in participants:
        calibration = p["et_doc"].get("calibrationData") or {}
        for phase in ("initial_validation", "final_validation"):
            validation = calibration.get(phase) or {}
            offsets = validation.get("average_offset") or []
            in_roi = validation.get("percent_in_roi") or []
            for i in range(max(len(offsets), len(in_roi))):
                offset = offsets[i] if i < len(offsets) and isinstance(offsets[i], dict) else {}
                rows.append(
                    {
                        "participant": p["participant"],
                        "condition": p["condition"],
                        "engine": p["et_doc"].get("engine", "new"),
                        "phase": phase,
                        "target_index": i + 1,
                        "average_offset_x": offset.get("x"),
                        "average_offset_y": offset.get("y"),
                        "percent_in_roi": in_roi[i] if i < len(in_roi) else np.nan,
                        "recalibration_performed": calibration.get("recalibration_performed"),
                    }
                )
    columns = ["participant", "condition", "engine", "phase", "target_index", "average_offset_x", "average_offset_y", "percent_in_roi", "recalibration_performed"]
    return pd.DataFrame(rows, columns=columns)


# ----------------------------------------------------------------------------- specialists


def build_specialists(participants, path):
    """Map a specialist roster (public IDs, or private e-mail/name columns) to public IDs."""
    roster = pd.read_csv(path)
    conditions = {p["participant"]: p["condition"] for p in participants}
    if "participant" in roster.columns:
        ids = [pid for pid in roster["participant"] if pid in conditions]
    else:
        by_email, by_name = {}, {}
        for p in participants:
            for doc in (p["mos_doc"], p["et_doc"]):
                by_email[norm_email(doc.get("participantEmail"))] = p["participant"]
                by_name[norm_name(doc.get("participantName"))] = p["participant"]
        ids = set()
        for _, row in roster.iterrows():
            email, name = norm_email(row.get("email")), norm_name(row.get("name"))
            pid = by_email.get(email) if email else None
            pid = pid or (by_name.get(name) if name else None)
            if pid:
                ids.add(pid)
    rows = [{"participant": pid, "condition": conditions[pid]} for pid in sorted(ids)]
    return pd.DataFrame(rows, columns=["participant", "condition"])


# ----------------------------------------------------------------------------- main


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--mos-results", default=RAW_DIR / "mos_results.anonymized.json.gz")
    parser.add_argument("--eyetracking-results", default=RAW_DIR / "eyetracking_results.anonymized.json.gz")
    parser.add_argument("--out-dir", default=DATA_DIR)
    parser.add_argument("--specialists", default=RAW_DIR / "specialist_participants.csv", help="roster CSV; skipped if missing")
    args = parser.parse_args()
    out = Path(args.out_dir)
    out.mkdir(parents=True, exist_ok=True)

    participants = pair_participants(load_documents(args.mos_results), load_documents(args.eyetracking_results))
    if not participants:
        raise SystemExit("No MOS/EyetrackingMOS participant pairs found.")
    print(f"paired participants: {len(participants)}")

    mos = build_mos_trials(participants)
    et, samples = build_eyetracking_trials(participants)
    calibration = build_calibration(participants)

    empty = et[et["gaze_sample_count"] == 0]
    if len(empty):
        raise SystemExit(f"{len(empty)} trials have no gaze samples with audioTime, e.g.\n{empty[['participant', 'trial_index', 'audio_identifier']].head()}")

    written = []
    for name, df in (("mos_trials.csv", mos), ("eyetracking_trials.csv", et), ("eyetracking_calibration.csv", calibration)):
        df.to_csv(out / name, index=False)
        written.append(out / name)
        print(f"{name}: {len(df)} rows")
    samples.to_csv(out / "eyetracking_gaze_samples.csv.gz", index=False, compression={"method": "gzip", "mtime": 0})
    written.append(out / "eyetracking_gaze_samples.csv.gz")
    print(f"eyetracking_gaze_samples.csv.gz: {len(samples)} rows")
    if Path(args.specialists).exists():
        specialists = build_specialists(participants, args.specialists)
        specialists.to_csv(out / "specialist_participants.csv", index=False)
        written.append(out / "specialist_participants.csv")
        print(f"specialist_participants.csv: {len(specialists)} rows")

    with open(out / "SHA256SUMS", "w", encoding="utf-8") as f:
        for path in sorted(written, key=lambda p: p.name):
            f.write(f"{hashlib.sha256(path.read_bytes()).hexdigest()}  {path.name}\n")
    print(f"written to {out}")


if __name__ == "__main__":
    main()
