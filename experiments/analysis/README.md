# Public analysis workflow

This workflow reproduces the paper statistics and figures using only the
pseudonymized files in [`../data`](../data/). It does not require or read the
private session exports, participant names, email addresses, tokens, or the
private participant mapping.

## Run

From this directory:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python3 run_all.py
```

Generated tables, figures, and `summary.json` are written to `output/`.

The workflow validates participant and trial counts before analysis. Randomized
analyses use the fixed seed `12345`: 5,000 speaker-cluster bootstrap resamples
for correlation intervals and 1,000 stratified samples for the specialist
robustness analysis.

## Analysis modules

- `scores.py`: participant/audio and audio-level score tables.
- `stats_correlations.py`: correlations, errors, and cluster-bootstrap intervals.
- `stats_mixed.py`: crossed participant/stimulus mixed-effects models.
- `gaze_quality.py`: sampling/dwell quality and sensitivity analysis.
- `gaze_dynamics.py`: I-DT fixation, saccade, AOI-switch, and scanpath metrics.
- `balanced_2to1.py`: specialist/non-specialist robustness analysis.
- `figures.py`: publication figures.
