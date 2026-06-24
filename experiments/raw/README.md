# Anonymized raw exports

This folder contains compressed raw result exports used to regenerate the public
analysis data in [`../data`](../data/).

| File | Description |
| --- | --- |
| `mos_results.anonymized.json.gz` | Anonymized raw MOS session documents |
| `eyetracking_results.anonymized.json.gz` | Anonymized raw EyetrackingMOS session documents |
| `specialist_participants.csv` | Pseudonymous specialist subset for the robustness analysis |

The JSON exports use release-only participant identifiers:

- names are `Participant P01`, `Participant P02`, etc.;
- emails are `participant01@example.com`, `participant02@example.com`, etc.;
- participant tokens, session IDs, experiment IDs, and absolute export timestamps
  are deterministic public placeholders.

The EyetrackingMOS raw export is already layout-correct: `presentedLeft`
describes the image rendered on the left side of the screen. The public analysis
code does not apply a left/right swap correction.

Regenerate public data with:

```bash
cd ../analysis
python3 prepare_public_data.py \
  --mos-results ../raw/mos_results.anonymized.json.gz \
  --eyetracking-results ../raw/eyetracking_results.anonymized.json.gz \
  --out-dir ../data
```
