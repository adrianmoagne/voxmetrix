# Reproducing the paper experiments

This directory contains the experiment definitions, pseudonymized publication
data, and analysis scripts used for the paper.

## Contents

- [`MOS.experiment.json`](MOS.experiment.json): importable MOS definition.
- [`EyetrackingMOS.experiment.json`](EyetrackingMOS.experiment.json): importable
  eye-tracking MOS definition.
- [`data/`](data/README.md): pseudonymized trial- and sample-level data.
- [`analysis/`](analysis/README.md): reproducibility workflow.

## Prerequisites

- A running VoxMetric instance. See the [project quick start](../README.md#quick-start-docker).
- Internet access. The definitions reference the original audio and image stimuli through pinned URLs.
- For `EyetrackingMOS.experiment.json`: a computer with a webcam, browser camera permission, stable lighting, and a participant positioned directly in front of the screen.

## Import the definitions

1. Start VoxMetric and open `http://localhost:3001`.
2. Create an account or sign in.
3. Open **Projects**, create a project, and open it.
4. Select **Import**.
5. Choose either `MOS.experiment.json` or `EyetrackingMOS.experiment.json` from this directory.
6. VoxMetric creates a project-local copy and opens it in the experiment editor.
7. Select **Save Experiment** before distributing participant links.

Import the second file in the same way if both experiments will be reproduced.

## Run the experiments

1. Return to the project containing the imported experiment.
2. Open the experiment's actions menu and select **Invite Participants**.
3. Copy the generated participant URL.
4. Append the assigned condition to the URL:

```text
https://<voxmetric-host>/experiment/run/<experiment-id>?condition=A
https://<voxmetric-host>/experiment/run/<experiment-id>?condition=B
```

5. Give each participant only the URL for their assigned condition.
6. The participant enters an email address and completes the experiment in the browser.

The condition parameter is required by these definitions. Opening a participant
link without `?condition=A` or `?condition=B` will not start a valid assigned run.

## Reproduce the analysis

```bash
cd experiments/analysis
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python3 run_all.py
```

The workflow reads only the pseudonymized files under `experiments/data/`.
