# Public analysis workflow

Reproduces the paper statistics and figures from the public data in
[`../data`](../data/). Nothing here needs private names, e-mails or tokens.

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python3 run_all.py
```

Tables, figures and `summary.json` are written to `output/`. The run takes about
a minute.

To rebuild the public CSVs from the anonymized raw exports in [`../raw`](../raw/)
first (defaults point at those files):

```bash
python3 prepare_public_data.py
python3 run_all.py
```

## Files

| File | What it does |
| --- | --- |
| `prepare_public_data.py` | Raw session JSON -> `../data/*.csv`. Pairs participants across the two experiments, parses stimulus names, computes per-trial gaze dwell and EyetrackingMOS, writes `SHA256SUMS`. |
| `run_all.py` | `../data/*.csv` -> `output/`. Runs top to bottom: validation, scores, correlations with speaker-cluster bootstrap, specialist robustness, mixed effects, gaze quality, gaze dynamics, figures, summary. |
| `gaze.py` | Gaze math for one trial, shared by both scripts: sample durations, dwell per AOI, EyetrackingMOS bins, I-DT fixations, dynamics metrics. |
| `figures.py` | The paper figures. |

## How gaze time is measured

Every gaze sample carries `audioTime`, the audio player's position (seconds) when
the sample was taken. A sample lasts until the next sample **on that clock**, so
time only accrues while the clip is actually playing; samples taken while the
player was paused or after the clip ended weigh zero, and samples without
`audioTime` (player not running) are dropped. `person_gaze_pct` is the share of
on-screen dwell spent on the half of the screen showing the person, and
`eyetracking_mos` maps it to five 20-point bins.

The clip duration used for `audio_coverage_pct` is the largest `audioTime` ever
recorded for that audio (the player clamps at the end of the clip).

Fixation detection (`gaze.fixations`) is the one place that uses the browser
timestamp `t_ms`, because it describes eye movement rather than listening time.

Randomized steps use the fixed seed `12345`: 5,000 speaker-cluster bootstrap
resamples for correlation intervals and 1,000 random panels for the 2:1
specialist robustness analysis.
