# Published data

These files contain the data used by the paper analysis. Participant
identifiers (`P01`–`P61`) are release-only codes. No participant names, email
addresses, account identifiers, or private mappings are included.

| File                              |    Rows | Description                                                        |
| --------------------------------- | ------: | ------------------------------------------------------------------ |
| `mos_trials.csv`                  |   3,660 | One explicit MOS response per participant and audio                |
| `eyetracking_trials.csv`          |   3,660 | Trial-level gaze, quality, AOI, and EyetrackingMOS measures        |
| `eyetracking_gaze_samples.csv.gz` | 604,749 | Compressed sample-level gaze observations                          |
| `eyetracking_calibration.csv`     |      70 | Eye-tracker calibration validation summaries when available        |
| `specialist_participants.csv`     |      13 | Pseudonymous specialist subset used by the 2:1 robustness analysis |

Each of the 61 participants contributes 60 MOS and 60 eye-tracking trials.
Conditions `A` and `B` identify the counterbalanced stimulus lists. `engine`
identifies the VoxMetrix collection-engine generation (`old` or `new`).

## Key fields

- `participant`: pseudonymous participant code.
- `audio_identifier`: stimulus filename stem.
- `speaker`: speaker/stimulus cluster used by the cluster bootstrap.
- `voice_type`: `natural` or `synthetic`.
- `mos_rating`: explicit 1–5 naturalness rating.
- `person_gaze_pct`: percentage of valid person/robot dwell assigned to the person AOI.
- `eyetracking_mos`: `person_gaze_pct` mapped to five equal-width score bins.
- `aoi`: screen-half AOI classification (`person`, `robot`, or `off_screen`).
- `aoi_bbox`: classification using the rendered image rectangles.
- `norm_x`, `norm_y`: gaze coordinates normalized by browser-window dimensions.
- `t_ms`, `audio_time_s`: gaze timing within the recorded trial/audio.
- `eyetracking_calibration.csv`: calibration validation summaries extracted from
  raw exports that included them.

File-integrity hashes are listed in [`SHA256SUMS`](SHA256SUMS). Verify them from
this directory with:

```bash
sha256sum -c SHA256SUMS
```
