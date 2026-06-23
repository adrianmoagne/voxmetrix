"""Reproduce the published MOS x EyetrackingMOS analysis from public data."""
import json
import os

from analysis import (
    balanced_2to1,
    common,
    figures,
    gaze_dynamics,
    gaze_quality,
    scores,
    stats_correlations,
    stats_mixed,
)


def _correlation(correlations, subset, metric):
    row = correlations[
        (correlations["subset"] == subset) & (correlations["metric"] == metric)
    ].iloc[0]
    return {"value": row["value"], "ci_low": row["ci_low"], "ci_high": row["ci_high"]}


def main():
    common.ensure_dirs()
    print("[1/8] Loading and validating public data")
    mos = common.load_mos()
    eyetracking = common.load_eyetracking_trials()
    gaze = common.load_gaze_samples()
    common.validate_public_data(mos, eyetracking, gaze)

    print("[2/8] Participant and audio scores")
    participant_audio, audio, merged = scores.build(mos, eyetracking)
    scores.write(participant_audio, audio)

    print("[3/8] Correlations and balanced robustness analysis")
    correlations = stats_correlations.build(audio)
    stats_correlations.write(correlations)
    balanced = balanced_2to1.build(merged=merged)
    balanced_2to1.write(balanced)

    print("[4/8] Mixed-effects tests")
    mixed = stats_mixed.build(merged)
    stats_mixed.write(mixed)

    print("[5/8] Gaze quality sensitivity")
    quality, sensitivity, (quality_kept, quality_total) = gaze_quality.build(mos, eyetracking)
    gaze_quality.write(quality, sensitivity)

    print("[6/8] Gaze dynamics")
    dynamics_trials, dynamics_tests, dynamics_correlations = gaze_dynamics.build(gaze, mos)
    gaze_dynamics.write(dynamics_trials, dynamics_tests, dynamics_correlations)

    print("[7/8] Figures")
    figures.build(audio, dynamics_tests, gaze)

    print("[8/8] Summary")
    summary = {
        "n_participants": int(mos["participant"].nunique()),
        "n_mos_trials": len(mos),
        "n_eyetracking_trials": len(eyetracking),
        "n_gaze_samples": len(gaze),
        "n_audios": len(audio),
        "quality_pass_rate_pct": round(100 * quality_kept / quality_total, 2),
        "pearson_overall": _correlation(correlations, "all", "pearson_r"),
        "pearson_natural": _correlation(correlations, "natural", "pearson_r"),
        "pearson_synthetic": _correlation(correlations, "synthetic", "pearson_r"),
        "pearson_voice_adjusted": _correlation(
            correlations, "voice_adjusted", "pearson_r"
        ),
        "rmse_overall": _correlation(correlations, "all", "rmse"),
        "mixed_effects_natural_minus_synthetic": {
            row["outcome"]: {
                "estimate": row["estimate"],
                "ci_low": row["ci_low"],
                "ci_high": row["ci_high"],
                "p_value": row["p_value"],
                "cohens_dz": row["cohens_dz"],
            }
            for _, row in mixed.iterrows()
        },
        "specialists_by_condition": balanced.attrs["specialists_by_list"],
    }
    with open(os.path.join(common.OUTPUT_DIR, "summary.json"), "w", encoding="utf-8") as file:
        json.dump(summary, file, indent=2)
    print(f"Done. Outputs written to {common.OUTPUT_DIR}")


if __name__ == "__main__":
    main()
