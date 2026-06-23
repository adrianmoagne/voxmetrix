"""Mixed-effects natural-versus-synthetic comparisons."""
import os
import warnings

import numpy as np
import pandas as pd
import statsmodels.formula.api as smf

from analysis import common, scores


def cohens_dz(df, score_col):
    per = df.groupby(["participant", "voice_type"])[score_col].mean().unstack("voice_type")
    per = per.dropna(subset=["natural", "synthetic"])
    difference = per["natural"] - per["synthetic"]
    return float(difference.mean() / difference.std(ddof=1)), len(difference)


def fit_one(df, score_col, label):
    data = df[["participant", "audio_identifier", "voice_type", score_col]].dropna().copy()
    data["natural"] = (data["voice_type"] == "natural").astype(float)
    data = data.rename(columns={score_col: "score"})
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        model = smf.mixedlm(
            "score ~ natural",
            data,
            groups=np.ones(len(data)),
            vc_formula={
                "participant": "0 + C(participant)",
                "stimulus": "0 + C(audio_identifier)",
            },
        )
        result = model.fit(reml=True, method="lbfgs")
    interval = result.conf_int().loc["natural"]
    effect, n_participants = cohens_dz(df, score_col)
    return {
        "outcome": label,
        "term": "natural_minus_synthetic",
        "estimate": result.params["natural"],
        "std_error": result.bse["natural"],
        "ci_low": interval[0],
        "ci_high": interval[1],
        "p_value": result.pvalues["natural"],
        "cohens_dz": effect,
        "n_participants": n_participants,
        "n_obs": len(data),
    }


def build(merged=None):
    merged = scores.build()[2] if merged is None else merged
    return pd.DataFrame(
        [
            fit_one(merged, "mos_rating", "MOS"),
            fit_one(merged, "eyetracking_mos", "EyetrackingMOS"),
        ]
    )


def write(df):
    common.ensure_dirs()
    path = os.path.join(common.OUTPUT_DIR, "mixed_effects_condition_tests.csv")
    df.to_csv(path, index=False)
    return path
