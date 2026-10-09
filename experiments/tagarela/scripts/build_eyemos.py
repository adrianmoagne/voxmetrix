"""EyeMOS for the Tagarela 40, cloned from experiments/EyetrackingMOS.experiment.json.

Groups (each participant hears all 40 sentences once):
  G1: Natural = C1, Modelo A = C2, Modelo B = C3
  G2: Natural = C2, Modelo A = C3, Modelo B = C1
  G3: Natural = C3, Modelo A = C1, Modelo B = C2
Images: h.png (human, female and male faces) and r.png (robot), on the trials and the training screens.
"""
import copy, csv, datetime, json, uuid

REPO = str(__import__("pathlib").Path(__file__).resolve().parents[3])
OUT = f"{REPO}/experiments/tagarela"
SOURCE = json.load(open(f"{REPO}/experiments/EyetrackingMOS.experiment.json"))["definition"]

manifest = list(csv.DictReader(open(f"{OUT}/manifest.csv")))
URL = {r["filename"][:-5]: r["url"] for r in manifest}
DURATION = {r["utterance"]: float(r["duration_s"]) for r in manifest if r["system"] == "gt"}
UTTS = sorted(DURATION)

HUMAN = "https://res.cloudinary.com/dksemmwll/image/upload/v1773838376/tts/h.png"
ROBOT = "https://res.cloudinary.com/dksemmwll/image/upload/v1773838377/tts/r.png"
# EyetrackingMOS images (training screens) -> Tagarela images
IMAGE_SWAP = {
	"https://res.cloudinary.com/dksemmwll/image/upload/v1758826763/tts/pessoa.jpg": HUMAN,
	"https://res.cloudinary.com/dksemmwll/image/upload/v1779899211/w_xguhja.jpg": HUMAN,
	"https://res.cloudinary.com/dksemmwll/image/upload/v1757710088/tts/robo.jpg": ROBOT,
}
blocks = {b["name"]: b for b in SOURCE["blocks"]}

# C1/C2/C3 (13/13/14), balanced by natural-recording duration
by_dur = sorted(UTTS, key=DURATION.get)
SUBSETS = {"C3": [], "C1": [], "C2": []}
for i, u in enumerate(by_dur):
	list(SUBSETS.values())[i % 3].append(u)
SUBSETS = {k: sorted(SUBSETS[k]) for k in ("C1", "C2", "C3")}
SUBSET_OF = {u: k for k, us in SUBSETS.items() for u in us}

ROLES = {"Natural": "gt", "Modelo A": "chatterbox", "Modelo B": "orpheus_random"}
GROUPS = {"G1": ("C1", "C2", "C3"), "G2": ("C2", "C3", "C1"), "G3": ("C3", "C1", "C2")}
RECALIBRATE_AFTER = (13, 26)

uid = lambda: str(uuid.uuid4())

def fresh(entity):
	entity = copy.deepcopy(entity)
	def walk(node):
		if isinstance(node, dict):
			if "uid" in node:
				node["uid"] = uid()
			if node.get("kind") == "ContinueButton" and node["props"].get("label") == "Continue":
				node["props"]["label"] = "Continuar"
			src = node.get("props", {}).get("imageSrc") if node.get("kind") == "Image" else None
			if isinstance(src, str) and src in IMAGE_SWAP:
				node["props"]["imageSrc"] = IMAGE_SWAP[src]
			for value in node.values():
				walk(value)
		elif isinstance(node, list):
			for value in node:
				walk(value)
	walk(entity)
	return entity

instructions = fresh(blocks["Instructions"]); instructions["name"] = "Instruções"
evaluation = fresh(blocks["evaluation"]); evaluation["name"] = "Avaliação"
# EyetrackingMOS swaps sides with the legacy LateralCounterbalance (image_a/b -> image_left/right).
# Here the left/right images bind image_a (human) / image_b (robot) and ShuffleStimuli swaps them.
trial = evaluation["steps"][0]
images = sorted((c for c in trial["children"] if c["kind"] == "Image"), key=lambda c: c["placement"]["position"])
assert [c["placement"]["position"] for c in images] == ["CL", "CR"]
images[0]["props"]["imageSrc"]["column"] = "image_a"
images[1]["props"]["imageSrc"]["column"] = "image_b"
trial["behaviors"] = [b for b in trial["behaviors"] if b["kind"] != "LateralCounterbalance"] + [
	{"uid": uid(), "kind": "ShuffleStimuli", "name": "Shuffle Stimuli", "props": {"entityUids": [c["uid"] for c in images]}}]
calibration = fresh(blocks["calibration"]); calibration["name"] = "Recalibração"
feedback = fresh(blocks["feedback"]); feedback["name"] = "Questionário final"

COLUMNS = ["audio_src", "image_a", "image_b", "utterance", "subset", "role", "system"]
empty = {c: "" for c in COLUMNS}
rows = [{"uid": uid(), "blockUid": instructions["uid"], "values": dict(empty), "fixed": True}]
for group, (natural, model_a, model_b) in GROUPS.items():
	role_of = {**{u: "Natural" for u in SUBSETS[natural]},
			   **{u: "Modelo A" for u in SUBSETS[model_a]},
			   **{u: "Modelo B" for u in SUBSETS[model_b]}}
	for n, u in enumerate(UTTS, start=1):
		role = role_of[u]
		system = ROLES[role]
		rows.append({"uid": uid(), "blockUid": evaluation["uid"], "condition": group, "values": {
			"audio_src": URL[f"{system}_{u}"], "image_a": HUMAN, "image_b": ROBOT,
			"utterance": u, "subset": SUBSET_OF[u], "role": role, "system": system}})
		if n in RECALIBRATE_AFTER:
			rows.append({"uid": uid(), "blockUid": calibration["uid"], "condition": group,
						 "values": dict(empty), "fixed": True})
rows.append({"uid": uid(), "blockUid": feedback["uid"], "values": dict(empty), "fixed": True})

definition = {
	"schemaVersion": 2, "uid": uid(), "name": "EyeMOS",
	"description": "Eye tracking (humano x robô) com as 40 sentenças: Natural, Modelo A e Modelo B em quadrado latino, grupos G1/G2/G3.",
	"blocks": [instructions, evaluation, calibration, feedback],
	"spreadsheet": {"columns": [{"key": c, "type": "string"} for c in COLUMNS], "rows": rows,
					"shuffleMode": "within-group"},
	"participantAssignment": {"enabled": True, "mode": "url", "groups": list(GROUPS)},
}
now = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")
json.dump({"$type": "voxmetrix/experiment-definition", "exportedAt": now, "definition": definition},
		  open(f"{OUT}/EyeMOS.experiment.json", "w"), ensure_ascii=False, indent="\t")

for k, us in SUBSETS.items():
	print(k, len(us), " ".join(us))
from collections import Counter
print(Counter((r.get("condition"), r["values"].get("role")) for r in rows if r["values"].get("role")))
print("calibration rows:", sum(r["blockUid"] == calibration["uid"] for r in rows))
