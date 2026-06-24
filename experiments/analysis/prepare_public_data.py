"""Prepare public analysis data from anonymized raw VoxMetrix result exports."""
from __future__ import annotations

import argparse
import hashlib
import os
from pathlib import Path

import pandas as pd

from analysis import raw_exports

ANALYSIS_DIR = Path(__file__).resolve().parent
EXPERIMENTS_DIR = ANALYSIS_DIR.parent
DEFAULT_OUT_DIR = EXPERIMENTS_DIR / "data"
DEFAULT_SPECIALISTS = EXPERIMENTS_DIR / "raw" / "specialist_participants.csv"

CALIBRATION_COLUMNS = [
    "participant",
    "condition",
    "engine",
    "phase",
    "target_index",
    "average_offset_x",
    "average_offset_y",
    "percent_in_roi",
    "recalibration_performed",
]


def main() -> None:
    args = parse_args()
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    mos_docs = raw_exports.load_documents(args.mos_results)
    eyetracking_docs = raw_exports.load_documents(args.eyetracking_results)
    participants = raw_exports.pair_participants(mos_docs, eyetracking_docs)
    if not participants:
        raise SystemExit("No MOS/EyetrackingMOS participant pairs found.")

    print(f"Paired participants: {len(participants)}")
    mos = raw_exports.build_mos_trials(participants)
    eyetracking, gaze = raw_exports.build_eyetracking_trials(participants)
    calibration = raw_exports.build_calibration(participants)
    if calibration.empty:
        calibration = pd.DataFrame(columns=CALIBRATION_COLUMNS)

    written = [
        write_csv(mos, out_dir / "mos_trials.csv"),
        write_csv(eyetracking, out_dir / "eyetracking_trials.csv"),
        write_csv(calibration, out_dir / "eyetracking_calibration.csv"),
        write_csv_gzip(gaze, out_dir / "eyetracking_gaze_samples.csv.gz"),
    ]

    specialists_path = specialist_source(args.specialists)
    if specialists_path is not None:
        specialists = build_specialists(participants, specialists_path)
        written.append(write_csv(specialists, out_dir / "specialist_participants.csv"))
        print(f"Specialists: {len(specialists)} rows")

    write_sha256(out_dir, written)
    print(f"MOS trials: {len(mos)}")
    print(f"Eyetracking trials: {len(eyetracking)}")
    print(f"Gaze samples: {len(gaze)}")
    print(f"Calibration rows: {len(calibration)}")
    print(f"Written to: {out_dir}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Convert anonymized, layout-correct raw VoxMetrix exports into public analysis data."
    )
    parser.add_argument("--mos-results", required=True, help="MOS result export (.json or .json.gz)")
    parser.add_argument(
        "--eyetracking-results",
        required=True,
        help="EyetrackingMOS result export (.json or .json.gz)",
    )
    parser.add_argument(
        "--out-dir",
        default=str(DEFAULT_OUT_DIR),
        help=f"Output directory for public data tables (default: {DEFAULT_OUT_DIR})",
    )
    parser.add_argument(
        "--specialists",
        default=None,
        help=(
            "Optional specialist roster CSV. If omitted, ../raw/specialist_participants.csv "
            "is used when present. The CSV may contain participant/condition columns, or "
            "private email/name columns that will be mapped to public participant IDs."
        ),
    )
    return parser.parse_args()


def specialist_source(path: str | None) -> Path | None:
    if path:
        return Path(path)
    if DEFAULT_SPECIALISTS.exists():
        return DEFAULT_SPECIALISTS
    return None


def write_csv(df: pd.DataFrame, path: Path) -> Path:
    df.to_csv(path, index=False)
    return path


def write_csv_gzip(df: pd.DataFrame, path: Path) -> Path:
    df.to_csv(path, index=False, compression={"method": "gzip", "mtime": 0})
    return path


def build_specialists(participants: list[dict], path: Path) -> pd.DataFrame:
    source = pd.read_csv(path)
    participant_conditions = {
        participant["participant"]: participant["condition"] for participant in participants
    }
    valid_participants = set(participant_conditions)

    if "participant" in source.columns:
        specialists = source[["participant"]].copy()
        if "condition" in source.columns:
            specialists["condition"] = source["condition"]
        else:
            specialists["condition"] = specialists["participant"].map(participant_conditions)
        specialists = specialists[specialists["participant"].isin(valid_participants)]
        return specialists.sort_values("participant").reset_index(drop=True)

    lookup: dict[tuple[str, str], str] = {}
    for participant in participants:
        pid = participant["participant"]
        for doc_key in ("mos_doc", "eyetracking_doc"):
            doc = participant[doc_key]
            email = raw_exports.norm_email(doc.get("participantEmail"))
            name = raw_exports.norm_name(doc.get("participantName"))
            if email:
                lookup[("email", email)] = pid
            if name:
                lookup[("name", name)] = pid

    matched: set[str] = set()
    for _, row in source.iterrows():
        email = raw_exports.norm_email(row.get("email"))
        name = raw_exports.norm_name(row.get("name"))
        if email and ("email", email) in lookup:
            matched.add(lookup[("email", email)])
        elif name and ("name", name) in lookup:
            matched.add(lookup[("name", name)])

    rows = [
        {"participant": participant, "condition": participant_conditions[participant]}
        for participant in sorted(matched)
    ]
    return pd.DataFrame(rows, columns=["participant", "condition"])


def write_sha256(out_dir: Path, paths: list[Path]) -> Path:
    path = out_dir / "SHA256SUMS"
    lines = []
    for file_path in sorted(paths, key=lambda value: value.name):
        digest = hashlib.sha256(file_path.read_bytes()).hexdigest()
        lines.append(f"{digest}  {file_path.name}")
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return path


if __name__ == "__main__":
    # Keep BLAS thread counts deterministic and modest when users run this from
    # notebooks or CI shells that did not configure them explicitly.
    os.environ.setdefault("OPENBLAS_NUM_THREADS", "1")
    os.environ.setdefault("OMP_NUM_THREADS", "1")
    main()
