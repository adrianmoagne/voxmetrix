# Public analysis workflow

This workflow reproduces the paper statistics and figures from public data.
The committed raw exports are anonymized; the analysis code
does not require private names, emails, tokens, session IDs, or a private
participant mapping.

## Run from prepared public data

From this directory:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python3 run_all.py
```

Generated tables, figures, and `summary.json` are written to `output/`.

## Rebuild public data from anonymized raw exports

The CSV files in [`../data`](../data/) can be regenerated from the compressed raw
exports in [`../raw`](../raw/):

```bash
python3 prepare_public_data.py \
  --mos-results ../raw/mos_results.anonymized.json.gz \
  --eyetracking-results ../raw/eyetracking_results.anonymized.json.gz \
  --out-dir ../data
```

Then run:

```bash
python3 run_all.py
```

`prepare_public_data.py` also accepts fresh VoxMetrix result exports from newly
imported experiments.

The workflow validates participant and trial counts before analysis. Randomized
analyses use the fixed seed `12345`: 5,000 speaker-cluster bootstrap resamples
for correlation intervals and 1,000 stratified samples for the specialist
robustness analysis.

## Analysis modules

- `scores.py`: participant/audio and audio-level score tables.
- `stats_correlations.py`: correlations, errors, and cluster-bootstrap intervals.
- `stats_mixed.py`: crossed participant/stimulus mixed-effects models.
- `gaze_quality.py`: sampling/dwell quality and sensitivity analysis.
- `gaze_dynamics.py`:  fixation, saccade, AOI, and scanpath metrics.
- `balanced_2to1.py`: specialist/non-specialist robustness analysis.
- `figures.py`: publication figures.
- `raw_exports.py`: raw JSON export parsing and public CSV generation.
