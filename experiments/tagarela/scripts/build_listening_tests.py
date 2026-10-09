"""Sim-MOS, XAB and CMOS (pt-BR), laid out like experiments/MOS.experiment.json.

Writes experiments/tagarela/*.experiment.json. Audio URLs come from experiments/tagarela/manifest.csv.
"""
import copy, csv, datetime, json, pathlib, uuid

REPO = str(pathlib.Path(__file__).resolve().parents[3])
OUT = f"{REPO}/experiments/tagarela"
MOS = json.load(open(f"{REPO}/experiments/MOS.experiment.json"))["definition"]

manifest = list(csv.DictReader(open(f"{OUT}/manifest.csv")))
URL = {r["filename"][:-5]: r["url"] for r in manifest}
SUBSET = {r["utterance"]: r["subset"] for r in manifest}
UTTS = sorted(SUBSET)
C1 = [u for u in UTTS if SUBSET[u] == "C1"]
C2 = [u for u in UTTS if SUBSET[u] == "C2"]
NATURAL, MODEL_A, MODEL_B = "gt", "chatterbox", "orpheus_random"

uid = lambda: str(uuid.uuid4())

def fresh(entity):
	"""Deep copy with new uids, translating the English button label used in MOS."""
	entity = copy.deepcopy(entity)
	def walk(node):
		if isinstance(node, dict):
			if "uid" in node:
				node["uid"] = uid()
			if node.get("kind") == "ContinueButton" and node["props"].get("label") == "Continue":
				node["props"]["label"] = "Continuar"
			for value in node.values():
				walk(value)
		elif isinstance(node, list):
			for value in node:
				walk(value)
	walk(entity)
	return entity

def place(area, position, order, **kw):
	return {"area": area, "position": position, "order": order, **kw}

def text(t, area, position, order, size=20, **kw):
	return {"uid": uid(), "kind": "Text", "name": "Text", "placement": place(area, position, order),
			"phase": "all", "props": {"text": t, "fontSize": size, **kw}}

def button(label, area, position, order):
	return {"uid": uid(), "kind": "ContinueButton", "name": "ContinueButton",
			"placement": place(area, position, order), "phase": "ready", "props": {"label": label}}

def audio(column, order):
	return {"uid": uid(), "kind": "AudioPlayer", "name": "AudioPlayer", "placement": place("heading", "UC", order),
			"phase": "stimulus",
			"props": {"audioSrc": {"kind": "binding", "column": column}, "autoplay": False, "hidden": False}}

def rating(prompt, scale, order, layout=None):
	props = {"prompt": prompt, "scale": scale, "confirmLabel": "Confirmar",
			 "lockedHint": "Ouça todos os áudios até o final para responder."}
	if layout:
		props["layout"] = layout
	return {"uid": uid(), "kind": "RatingScale", "name": "RatingScale",
			"placement": place("content", "C", order, vAlign="top"), "phase": "response", "props": props}

def advance(when):
	return {"uid": uid(), "kind": "AdvanceRule", "name": "Advance Rule", "props": {"when": when}}

def screen(name, children, behaviors):
	return {"uid": uid(), "kind": "Screen", "name": name,
			"props": {"grid": {"type": "3x3", "subtype": "equal"}}, "children": children, "behaviors": behaviors}

def info_screen(name, title, lines):
	"""Same pattern as MOS train_instruc_1: title 23, lines 20 in heading UC, button in content C."""
	children = [text(title, "heading", "UC", 0, 23)]
	children += [text(line, "heading", "UC", i + 1) for i, line in enumerate(lines)]
	children.append(button("Continuar", "content", "C", len(children)))
	return screen(name, children, [advance("continue-click")])

def trial_screen(name, labelled_players, prompt, scale, layout=None, shuffle=()):
	"""Labelled players stacked in heading UC (like MOS's audio), rating in content C (like MOS).

	`shuffle` names the labels whose players swap sources at random each trial (ShuffleStimuli);
	the labels stay in place.
	"""
	children, order, shuffled = [], 0, []
	for label, column in labelled_players:
		player = audio(column, order + 1)
		children += [text(label, "heading", "UC", order), player]
		if label in shuffle:
			shuffled.append(player["uid"])
		order += 2
	children.append(rating(prompt, scale, order, layout))
	behaviors = [advance("responses-complete"),
				 {"uid": uid(), "kind": "AudioProgress", "name": "Audio Progress", "props": {"label": "Avaliação"}}]
	if shuffled:
		behaviors.append({"uid": uid(), "kind": "ShuffleStimuli", "name": "Shuffle Stimuli",
						  "props": {"entityUids": shuffled}})
	return screen(name, children, behaviors)

TCLE = MOS["blocks"][0]["steps"][0]
FEEDBACK = MOS["blocks"][2]

def experiment(name, description, training_lines, trial, columns, trial_rows, groups=None):
	instructions = {"uid": uid(), "kind": "Block", "name": "Instruções", "props": {}, "steps": [
		fresh(TCLE),
		info_screen("treinamento_1", "Treinamento - passo 1 de 1", training_lines),
		info_screen("treinamento_concluido", "Treinamento - Concluído", [
			"Na próxima etapa o experimento será iniciado.",
			"Escute cada áudio com atenção quantas vezes for necessário."]),
	]}
	evaluation = {"uid": uid(), "kind": "Block", "name": "Avaliação", "props": {}, "steps": [trial]}
	feedback = fresh(FEEDBACK)
	feedback["name"] = "Questionário final"
	empty = {c: "" for c in columns}
	rows = [{"uid": uid(), "blockUid": instructions["uid"], "values": dict(empty), "fixed": True}]
	for values, condition in trial_rows:
		rows.append({"uid": uid(), "blockUid": evaluation["uid"], "values": values,
					 **({"condition": condition} if condition else {})})
	rows.append({"uid": uid(), "blockUid": feedback["uid"], "values": dict(empty), "fixed": True})
	definition = {"schemaVersion": 2, "uid": uid(), "name": name, "description": description,
				  "blocks": [instructions, evaluation, feedback],
				  "spreadsheet": {"columns": [{"key": c, "type": "string"} for c in columns],
								  "rows": rows, "shuffleMode": "within-group"}}
	if groups:
		definition["participantAssignment"] = {"enabled": True, "mode": "url", "groups": groups}
	return definition

LISTEN = "- Ouça os áudios até o final antes de responder. É permitido ouvir cada áudio quantas vezes for necessário."
HEADPHONES = "- Use fones de ouvido e ajuste o volume do seu computador."

# --- Sim-MOS: S1 = C1 Natural x A, C2 Natural x B; S2 = the reverse -------------------
sim_rows = []
for group, a_set in (("S1", C1), ("S2", C2)):
	for u in UTTS:
		system = MODEL_A if u in a_set else MODEL_B
		sim_rows.append(({"utterance": u, "subset": SUBSET[u], "system": system,
						  "ref_src": URL[f"{NATURAL}_{u}"], "test_src": URL[f"{system}_{u}"]}, group))
sim_mos = experiment(
	"Sim-MOS", "Similaridade de locutor (1 a 5): Natural x Modelo A e Natural x Modelo B, grupos S1/S2.",
	["Neste experimento, você ouvirá pares de áudios: uma Referência (voz natural) e uma Amostra.",
	 "- Avalie o quanto a voz da Amostra se parece com a voz da Referência, como se fossem a mesma pessoa falando.",
	 "- Desconsidere a qualidade da gravação e o conteúdo da frase.", LISTEN, HEADPHONES],
	trial_screen("sim_mos", [("Referência", "ref_src"), ("Amostra", "test_src")],
				 "Quão semelhante é a voz da Amostra à voz da Referência?",
				 [{"value": 1, "label": "1 - Nada semelhante"},
				  {"value": 2, "label": "2 - Pouco semelhante"},
				  {"value": 3, "label": "3 - Moderadamente semelhante"},
				  {"value": 4, "label": "4 - Muito semelhante"},
				  {"value": 5, "label": "5 - Extremamente semelhante"}]),
	["utterance", "subset", "system", "ref_src", "test_src"], sim_rows, groups=["S1", "S2"])

# --- XAB: X = natural, A/B = Modelo A / Modelo B with random sides --------------------------
xab = experiment(
	"XAB", "Referência X (natural) e amostras A/B (Modelo A x Modelo B, lados aleatórios): qual é mais semelhante a X?",
	["Neste experimento, você ouvirá uma referência X (voz natural) e duas amostras, A e B.",
	 "- Indique qual das amostras, A ou B, é mais semelhante à referência X.", LISTEN, HEADPHONES],
	trial_screen("xab", [("X (referência)", "x_src"), ("A", "model_a_src"), ("B", "model_b_src")],
				 "Qual amostra é mais semelhante à referência X?",
				 [{"value": 1, "label": "A"}, {"value": 2, "label": "B"}], layout="horizontal",
				 shuffle=("A", "B")),
	["utterance", "subset", "x_src", "model_a_src", "model_b_src"],
	[({"utterance": u, "subset": SUBSET[u], "x_src": URL[f"{NATURAL}_{u}"],
	   "model_a_src": URL[f"{MODEL_A}_{u}"], "model_b_src": URL[f"{MODEL_B}_{u}"]}, None) for u in UTTS])

# --- CMOS: Modelo A x Modelo B, random order, labels without numbers ------------------------
cmos = experiment(
	"CMOS", "Naturalidade comparativa (-3 a +3) entre Modelo A e Modelo B, ordem aleatória.",
	["Neste experimento, você ouvirá dois áudios com a mesma frase: Áudio 1 e Áudio 2.",
	 "- Compare a naturalidade do Áudio 2 em relação ao Áudio 1, ou seja, o quanto ele soa como uma pessoa real falando.",
	 "- Se os dois soarem igualmente naturais, escolha \"Igualmente natural\".", LISTEN, HEADPHONES],
	trial_screen("cmos", [("Áudio 1", "model_a_src"), ("Áudio 2", "model_b_src")],
				 "Comparado ao Áudio 1, o Áudio 2 soa:",
				 [{"value": -3, "label": "Muito menos natural"},
				  {"value": -2, "label": "Menos natural"},
				  {"value": -1, "label": "Um pouco menos natural"},
				  {"value": 0, "label": "Igualmente natural"},
				  {"value": 1, "label": "Um pouco mais natural"},
				  {"value": 2, "label": "Mais natural"},
				  {"value": 3, "label": "Muito mais natural"}],
				 shuffle=("Áudio 1", "Áudio 2")),
	["utterance", "subset", "model_a_src", "model_b_src"],
	[({"utterance": u, "subset": SUBSET[u],
	   "model_a_src": URL[f"{MODEL_A}_{u}"], "model_b_src": URL[f"{MODEL_B}_{u}"]}, None) for u in UTTS])

now = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")
for d in (sim_mos, xab, cmos):
	json.dump({"$type": "voxmetrix/experiment-definition", "exportedAt": now, "definition": d},
			  open(f"{OUT}/{d['name']}.experiment.json", "w"), ensure_ascii=False, indent="\t")
	print(d["name"], len(d["spreadsheet"]["rows"]), "rows", d.get("participantAssignment"))
