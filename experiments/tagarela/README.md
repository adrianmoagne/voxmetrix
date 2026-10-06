# Tagarela perceptual tests

Sim-MOS, XAB and CMOS definitions built from the Tagarela MOS samples
(Natural = ground truth, Modelo A = Chatterbox, Modelo B = Orpheus).

## Stimuli

40 utterances (every version is at least 5 s long), 3 systems each, hosted on
Cloudinary. [`manifest.csv`](manifest.csv) lists every file with its utterance,
system, C1/C2 subset, duration and URL.

The 40 utterances are the subset of the 46 that pass the 5 s rule whose ratings
in the original MOS export come closest to Table 2 of
https://arxiv.org/abs/2603.15326. The authors' exact 40 are unknown.

## Experiments

| File | Design | Trials |
|---|---|---|
| `Sim-MOS.experiment.json` | Reference (natural) vs sample, speaker similarity 1-5. Groups `S1`/`S2`. | 40 |
| `XAB.experiment.json` | X = natural, A/B = Modelo A/Modelo B with random left/right. Which is closer to X? | 40 |
| `CMOS.experiment.json` | Modelo A vs Modelo B in random order, comparative naturalness -3..+3. | 40 |

Groups: `S1` hears C1 as Natural x A and C2 as Natural x B; `S2` is the reverse.

## Import and run

Follow [`../README.md`](../README.md#import-the-definitions) to import each file
and save it. For Sim-MOS, give each participant a URL with their group:

```text
https://<voxmetrix-host>/experiment/run/<experiment-id>?condition=S1
https://<voxmetrix-host>/experiment/run/<experiment-id>?condition=S2
```

XAB and CMOS need no condition parameter.

## Analysis notes

- XAB and CMOS results record the left/right `presentation` (`swapped`) per trial.
- CMOS: the score is "Audio 2 relative to Audio 1". With `swapped: false`,
  Audio 2 is Modelo B, so the score is B vs A; negate it when `swapped: true`.
