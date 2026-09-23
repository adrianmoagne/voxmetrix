# Published data

These files contain the data used by the paper analysis. Participant
identifiers (`P01`–`P61`) are release-only codes. No participant names, email
addresses, account identifiers, or private mappings are included.

| File                              |    Rows | Description                                                        |
| --------------------------------- | ------: | ------------------------------------------------------------------ |
| `mos_trials.csv`                  |   3,660 | One explicit MOS response per participant and audio                |
| `eyetracking_trials.csv`          |   3,660 | Trial-level gaze dwell, quality, AOI boxes, and EyetrackingMOS     |
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
- `person_side`: half of the screen that showed the person image.
- `audio_time_covered_s`: seconds of the clip during which gaze was recorded (sum
  of sample durations on the audio clock).
- `person_dwell_s`, `robot_dwell_s`, `off_screen_dwell_s`: dwell per area of interest, in
  seconds of audio time.
- `valid_dwell_pct`: share of covered time with gaze on screen.
- `person_gaze_pct`: share of on-screen dwell on the person half.
- `eyetracking_mos`: `person_gaze_pct` mapped to five equal-width score bins.
- `gaze_sample_rate_hz`: samples per second of covered audio time.
- `audio_duration_s`, `audio_coverage_pct`: clip length (largest recorded
  `audioTime` for that audio) and the share of it covered by gaze.
- `t_ms`, `audio_time_s`: browser timestamp and audio-player position of each gaze sample.
- `aoi`: screen-half classification (`person`, `robot`, or `off_screen`).
- `aoi_bbox`: classification using the rendered image rectangles.
- `norm_x`, `norm_y`: gaze coordinates normalized by browser-window dimensions.

File-integrity hashes are listed in [`SHA256SUMS`](SHA256SUMS). Verify them from
this directory with:

```bash
sha256sum -c SHA256SUMS
```
