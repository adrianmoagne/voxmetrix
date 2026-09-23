"""Gaze math for one trial, shared by prepare_public_data.py and run_all.py.

Time is measured on the audio player's clock (`audio_time`, seconds). Each gaze
sample "lasts" until the next sample, but only while the audio advanced: samples
recorded while the clip was paused or already finished get zero weight. The one
exception is fixation detection, which uses the wall clock (`t_ms`) because it
describes eye movement, not listening time.
"""
import math

import numpy as np

AOIS = ("person", "robot", "off_screen")

# I-DT fixation detector parameters.
MIN_FIXATION_MS = 100.0
MAX_DISPERSION_PX = 80.0


def sample_durations(audio_time):
    """Seconds each sample lasts on the audio clock. The last sample lasts 0."""
    audio_time = np.asarray(audio_time, float)
    if len(audio_time) == 0:
        return audio_time
    return np.clip(np.diff(audio_time, append=audio_time[-1]), 0, None)


def dwell(durations, aoi):
    """Seconds spent on each area of interest."""
    aoi = np.asarray(aoi)
    return {name: float(durations[aoi == name].sum()) for name in AOIS}


def person_gaze_pct(dwell_s):
    """Share of on-screen dwell that landed on the person, in percent."""
    on_screen = dwell_s["person"] + dwell_s["robot"]
    return 100.0 * dwell_s["person"] / on_screen if on_screen > 0 else np.nan


def eyetracking_mos(pct):
    """Map person_gaze_pct to five equal 20-point bins: (0-20]=1 ... (80-100]=5."""
    if pct is None or math.isnan(pct):
        return np.nan
    return 1 + sum(pct > edge for edge in (20, 40, 60, 80))


def entropy_bits(dwell_s):
    """Shannon entropy of the dwell distribution over AOIs."""
    total = sum(dwell_s.values())
    if total <= 0:
        return np.nan
    shares = [v / total for v in dwell_s.values() if v > 0]
    return -sum(p * math.log2(p) for p in shares)


def fixations(t_ms, x, y, min_ms=MIN_FIXATION_MS, max_dispersion=MAX_DISPERSION_PX):
    """I-DT: grow windows of at least `min_ms` while (x range + y range) stays small.

    Returns a list of (duration_ms, center_x, center_y).
    """

    def dispersion(i, j):
        return (x[i : j + 1].max() - x[i : j + 1].min()) + (y[i : j + 1].max() - y[i : j + 1].min())

    out = []
    i, n = 0, len(t_ms)
    while i < n:
        j = i
        while j < n and t_ms[j] - t_ms[i] < min_ms:
            j += 1
        if j >= n:
            break
        if dispersion(i, j) > max_dispersion:
            i += 1
            continue
        while j + 1 < n and dispersion(i, j + 1) <= max_dispersion:
            j += 1
        out.append((t_ms[j] - t_ms[i], float(x[i : j + 1].mean()), float(y[i : j + 1].mean())))
        i = j + 1
    return out


def aoi_switches(aoi):
    """Number of person<->robot transitions, ignoring off-screen samples."""
    on_screen = [a for a in aoi if a != "off_screen"]
    return sum(a != b for a, b in zip(on_screen, on_screen[1:]))


DYNAMICS_METRICS = [
    "person_gaze_pct",
    "aoi_entropy_bits",
    "time_to_first_person_sec",
    "fixation_rate_hz",
    "mean_fixation_duration_ms",
    "saccade_rate_hz",
    "mean_saccade_amplitude_screen_diag",
    "aoi_switch_rate_hz",
    "scanpath_screen_diag_per_sec",
]


def trial_dynamics(t_ms, x, y, audio_time, aoi, screen_diag):
    """Gaze-dynamics metrics for one trial. Rates are per second of audio covered."""
    out = {name: np.nan for name in DYNAMICS_METRICS}
    durations = sample_durations(audio_time)
    seconds = float(durations.sum())
    if len(t_ms) < 2 or seconds <= 0:
        return out

    dwell_s = dwell(durations, aoi)
    out["person_gaze_pct"] = person_gaze_pct(dwell_s)
    out["aoi_entropy_bits"] = entropy_bits(dwell_s)

    first_person = next((i for i, a in enumerate(aoi) if a == "person"), None)
    if first_person is not None:
        out["time_to_first_person_sec"] = float(audio_time[first_person])

    fixs = fixations(t_ms, x, y)
    out["fixation_rate_hz"] = len(fixs) / seconds
    if fixs:
        out["mean_fixation_duration_ms"] = float(np.mean([f[0] for f in fixs]))
    if len(fixs) >= 2:
        amplitudes = [math.hypot(b[1] - a[1], b[2] - a[2]) for a, b in zip(fixs, fixs[1:])]
        out["saccade_rate_hz"] = (len(fixs) - 1) / seconds
        out["mean_saccade_amplitude_screen_diag"] = float(np.mean(amplitudes)) / screen_diag
    else:
        out["saccade_rate_hz"] = 0.0
    out["aoi_switch_rate_hz"] = aoi_switches(aoi) / seconds
    out["scanpath_screen_diag_per_sec"] = np.hypot(np.diff(x), np.diff(y)).sum() / screen_diag / seconds
    return out
