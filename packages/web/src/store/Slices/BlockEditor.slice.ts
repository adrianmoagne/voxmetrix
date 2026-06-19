import { createSlice } from "@reduxjs/toolkit";
import type { GenericAction } from "@/@types";
import type {
	BlockEntity,
	StepEntity,
	SpreadsheetDefinition,
	SpreadsheetColumn,
	SpreadsheetRow,
	ParticipantAssignmentConfig,
} from "@/@types/screen.model";

// --- Helpers ---

function makeEmptyRowValues(columns: SpreadsheetColumn[]): Record<string, string> {
	return Object.fromEntries(columns.map((column) => [column.key, ""]));
}

function isBindingRef(value: unknown): value is { kind: "binding"; column: string } {
	return (
		typeof value === "object" &&
		value !== null &&
		"kind" in value &&
		"valueOf" in value &&
		(value as { kind?: unknown }).kind === "binding" &&
		"column" in value &&
		typeof (value as { column?: unknown }).column === "string"
	);
}

function visitBindingRefs(value: unknown, visit: (binding: { kind: "binding"; column: string }) => void): void {
	if (Array.isArray(value)) {
		for (const item of value) {
			visitBindingRefs(item, visit);
		}
		return;
	}

	if (typeof value !== "object" || value === null) {
		return;
	}

	if (isBindingRef(value)) {
		visit(value);
		return;
	}

	for (const nestedValue of Object.values(value)) {
		visitBindingRefs(nestedValue, visit);
	}
}

function isColumnUsedBySteps(steps: StepEntity[], columnKey: string): boolean {
	return steps.some((step) => {
		let used = false;

		visitBindingRefs(step, (binding) => {
			if (binding.column === columnKey) {
				used = true;
			}
		});

		return used;
	});
}

function renameColumnBindingsInSteps(steps: StepEntity[], oldKey: string, newKey: string): void {
	for (const step of steps) {
		visitBindingRefs(step, (binding) => {
			if (binding.column === oldKey) {
				binding.column = newKey;
			}
		});
	}
}

function makeDefaultBlock(name = "Block 1"): BlockEntity {
	return {
		uid: crypto.randomUUID(),
		kind: "Block",
		name,
		props: {},
		steps: [],
	};
}

// --- State ---

export interface BlockEditorState {
	blocks: BlockEntity[];
	selectedBlockUid: string | null;
	spreadsheet: SpreadsheetDefinition;
	participantAssignment?: ParticipantAssignmentConfig;
}

const initialState: BlockEditorState = {
	blocks: [],
	selectedBlockUid: null,
	spreadsheet: { columns: [], rows: [], shuffleMode: "none" },
	participantAssignment: undefined,
};

// --- Slice ---

const blockEditorSlice = createSlice({
	name: "blockEditor",
	initialState,
	reducers: {
		// ---- Experiment-level ----

		loadExperiment: (
			state,
			action: GenericAction<{
				blocks: BlockEntity[];
				spreadsheet?: SpreadsheetDefinition;
				participantAssignment?: ParticipantAssignmentConfig;
			}>
		) => {
			state.blocks = structuredClone(action.payload.blocks);
			state.spreadsheet = action.payload.spreadsheet
				? structuredClone(action.payload.spreadsheet)
				: { columns: [], rows: [], shuffleMode: "none" };
			state.participantAssignment = action.payload.participantAssignment
				? structuredClone(action.payload.participantAssignment)
				: undefined;
			state.selectedBlockUid = state.blocks[0]?.uid ?? null;
		},

		// ---- Block CRUD ----

		addBlock: (state, action: GenericAction<BlockEntity | undefined>) => {
			const block = action.payload
				? structuredClone(action.payload)
				: makeDefaultBlock(`Block ${state.blocks.length + 1}`);
			state.blocks.push(block);
			state.selectedBlockUid = block.uid;
			// Auto-create first spreadsheet row for the new block
			state.spreadsheet.rows.push({
				uid: crypto.randomUUID(),
				blockUid: block.uid,
				values: makeEmptyRowValues(state.spreadsheet.columns),
			});
		},
		removeBlock: (state, action: GenericAction<string>) => {
			const uid = action.payload;
			state.blocks = state.blocks.filter((b) => b.uid !== uid);
			// Remove all rows belonging to this block
			state.spreadsheet.rows = state.spreadsheet.rows.filter((r) => r.blockUid !== uid);
			if (state.selectedBlockUid === uid) {
				state.selectedBlockUid = state.blocks[0]?.uid ?? null;
			}
		},
		selectBlock: (state, action: GenericAction<string>) => {
			state.selectedBlockUid = action.payload;
		},
		renameBlock: (state, action: GenericAction<{ uid: string; name: string }>) => {
			const block = state.blocks.find((b) => b.uid === action.payload.uid);
			if (block) block.name = action.payload.name;
		},
		moveBlock: (state, action: GenericAction<{ uid: string; direction: "left" | "right" }>) => {
			const { uid, direction } = action.payload;
			const idx = state.blocks.findIndex((b) => b.uid === uid);
			if (idx === -1) return;
			const target = direction === "left" ? idx - 1 : idx + 1;
			if (target < 0 || target >= state.blocks.length) return;
			[state.blocks[idx], state.blocks[target]] = [state.blocks[target], state.blocks[idx]];
		},
		duplicateBlock: (state, action: GenericAction<string>) => {
			const source = state.blocks.find((b) => b.uid === action.payload);
			if (!source) return;
			const clone = structuredClone(source);
			clone.uid = crypto.randomUUID();
			clone.name = `${source.name} (copy)`;
			clone.steps = clone.steps.map((s) => ({ ...s, uid: crypto.randomUUID() }));
			const idx = state.blocks.findIndex((b) => b.uid === action.payload);
			state.blocks.splice(idx + 1, 0, clone);
			state.selectedBlockUid = clone.uid;
			// Duplicate rows for the new block
			const sourceRows = state.spreadsheet.rows.filter((r) => r.blockUid === source.uid);
			const clonedRows = sourceRows.map((r) => ({
				...structuredClone(r),
				uid: crypto.randomUUID(),
				blockUid: clone.uid,
			}));
			state.spreadsheet.rows.push(...clonedRows);
		},

		// ---- Step actions (operate on selected block) ----

		addStep: (state, action: GenericAction<StepEntity>) => {
			const block = state.blocks.find((b) => b.uid === state.selectedBlockUid);
			if (block) block.steps.push(structuredClone(action.payload));
		},
		removeStep: (state, action: GenericAction<string>) => {
			const block = state.blocks.find((b) => b.uid === state.selectedBlockUid);
			if (block) block.steps = block.steps.filter((s) => s.uid !== action.payload);
		},
		moveStep: (state, action: GenericAction<{ uid: string; direction: "left" | "right" }>) => {
			const block = state.blocks.find((b) => b.uid === state.selectedBlockUid);
			if (!block) return;
			const { uid, direction } = action.payload;
			const idx = block.steps.findIndex((s) => s.uid === uid);
			if (idx === -1) return;
			const target = direction === "left" ? idx - 1 : idx + 1;
			if (target < 0 || target >= block.steps.length) return;
			[block.steps[idx], block.steps[target]] = [block.steps[target], block.steps[idx]];
		},
		updateStep: (state, action: GenericAction<StepEntity>) => {
			const block = state.blocks.find((b) => b.uid === state.selectedBlockUid);
			if (!block) return;
			const idx = block.steps.findIndex((s) => s.uid === action.payload.uid);
			if (idx !== -1) block.steps[idx] = structuredClone(action.payload);
		},
		renameStep: (state, action: GenericAction<{ uid: string; name: string }>) => {
			const block = state.blocks.find((b) => b.uid === state.selectedBlockUid);
			if (!block) return;
			const step = block.steps.find((s) => s.uid === action.payload.uid);
			if (step) step.name = action.payload.name;
		},
		updateStepProps: (
			state,
			action: GenericAction<{ uid: string; props: Record<string, unknown> }>
		) => {
			const block = state.blocks.find((b) => b.uid === state.selectedBlockUid);
			if (!block) return;
			const step = block.steps.find((s) => s.uid === action.payload.uid);
			if (step) Object.assign(step.props, action.payload.props);
		},

		// ---- Spreadsheet column actions ----

		addColumn: (state, action: GenericAction<SpreadsheetColumn>) => {
			state.spreadsheet.columns.push(action.payload);
			for (const row of state.spreadsheet.rows) {
				row.values[action.payload.key] = "";
			}
		},
		removeColumn: (state, action: GenericAction<string>) => {
			const key = action.payload;
			const isUsed = state.blocks.some((block) => isColumnUsedBySteps(block.steps, key));
			if (isUsed) {
				return;
			}

			state.spreadsheet.columns = state.spreadsheet.columns.filter((c) => c.key !== key);
			for (const row of state.spreadsheet.rows) {
				delete row.values[key];
			}
		},
		renameColumnKey: (state, action: GenericAction<{ oldKey: string; newKey: string }>) => {
			const { oldKey, newKey } = action.payload;
			const col = state.spreadsheet.columns.find((c) => c.key === oldKey);
			if (col) col.key = newKey;
			for (const row of state.spreadsheet.rows) {
				if (oldKey in row.values) {
					row.values[newKey] = row.values[oldKey];
					delete row.values[oldKey];
				}
			}
			for (const block of state.blocks) {
				renameColumnBindingsInSteps(block.steps, oldKey, newKey);
			}
		},
		updateColumnLabel: (state, action: GenericAction<{ key: string; label: string }>) => {
			const col = state.spreadsheet.columns.find((c) => c.key === action.payload.key);
			if (col) col.label = action.payload.label;
		},

		// ---- Spreadsheet row actions ----

		addRow: (state, action: GenericAction<string>) => {
			state.spreadsheet.rows.push({
				uid: crypto.randomUUID(),
				blockUid: action.payload,
				values: makeEmptyRowValues(state.spreadsheet.columns),
			});
		},
		insertRow: (
			state,
			action: GenericAction<{ blockUid: string; afterRowUid?: string }>
		) => {
			const newRow: SpreadsheetRow = {
				uid: crypto.randomUUID(),
				blockUid: action.payload.blockUid,
				values: makeEmptyRowValues(state.spreadsheet.columns),
			};

			if (action.payload.afterRowUid) {
				const insertIndex = state.spreadsheet.rows.findIndex(
					(row) => row.uid === action.payload.afterRowUid
				);
				if (insertIndex === -1) {
					state.spreadsheet.rows.push(newRow);
					return;
				}
				state.spreadsheet.rows.splice(insertIndex + 1, 0, newRow);
				return;
			}

			state.spreadsheet.rows.push(newRow);
		},
		moveRow: (state, action: GenericAction<{ rowUid: string; direction: "up" | "down" }>) => {
			const currentIndex = state.spreadsheet.rows.findIndex(
				(row) => row.uid === action.payload.rowUid
			);
			if (currentIndex === -1) return;

			const targetIndex =
				action.payload.direction === "up" ? currentIndex - 1 : currentIndex + 1;
			if (targetIndex < 0 || targetIndex >= state.spreadsheet.rows.length) return;

			const rows = state.spreadsheet.rows;
			[rows[currentIndex], rows[targetIndex]] = [rows[targetIndex], rows[currentIndex]];
		},
		updateRowBlock: (
			state,
			action: GenericAction<{ rowUid: string; blockUid: string }>
		) => {
			const row = state.spreadsheet.rows.find((entry) => entry.uid === action.payload.rowUid);
			if (row) {
				row.blockUid = action.payload.blockUid;
			}
		},
		removeRow: (state, action: GenericAction<string>) => {
			state.spreadsheet.rows = state.spreadsheet.rows.filter((r) => r.uid !== action.payload);
		},
		updateCell: (
			state,
			action: GenericAction<{ rowUid: string; key: string; value: string }>
		) => {
			const row = state.spreadsheet.rows.find((r) => r.uid === action.payload.rowUid);
			if (row) row.values[action.payload.key] = action.payload.value;
		},
	
		bulkFillColumn: (
			state,
			action: GenericAction<{ key: string; values: string[]; blockUid: string }>
		) => {
			const { key, values, blockUid } = action.payload;
			if (!state.spreadsheet.columns.some((c) => c.key === key)) return;

			let valueIndex = 0;
			for (const row of state.spreadsheet.rows) {
				if (valueIndex >= values.length) break;
				if (row.blockUid !== blockUid) continue;
				row.values[key] = values[valueIndex];
				valueIndex += 1;
			}

			if (valueIndex >= values.length) return;


			let insertIndex = state.spreadsheet.rows.length;
			for (let i = state.spreadsheet.rows.length - 1; i >= 0; i -= 1) {
				if (state.spreadsheet.rows[i].blockUid === blockUid) {
					insertIndex = i + 1;
					break;
				}
			}

			const newRows: SpreadsheetRow[] = [];
			while (valueIndex < values.length) {
				const rowValues = makeEmptyRowValues(state.spreadsheet.columns);
				rowValues[key] = values[valueIndex];
				newRows.push({
					uid: crypto.randomUUID(),
					blockUid,
					values: rowValues,
				});
				valueIndex += 1;
			}

			state.spreadsheet.rows.splice(insertIndex, 0, ...newRows);
		},
		setShuffleMode: (
			state,
			action: GenericAction<SpreadsheetDefinition["shuffleMode"]>
		) => {
			state.spreadsheet.shuffleMode = action.payload ?? "none";
		},
		updateRowFixed: (
			state,
			action: GenericAction<{ rowUid: string; fixed: boolean }>
		) => {
			const row = state.spreadsheet.rows.find((r) => r.uid === action.payload.rowUid);
			if (!row) return;
			if (action.payload.fixed) {
				row.fixed = true;
			} else {
				delete row.fixed;
			}
		},
		updateRowShuffleGroup: (
			state,
			action: GenericAction<{ rowUid: string; shuffleGroup: string }>
		) => {
			const row = state.spreadsheet.rows.find((r) => r.uid === action.payload.rowUid);
			if (!row) return;
			const cleaned = action.payload.shuffleGroup.trim();
			if (cleaned) {
				row.shuffleGroup = cleaned;
			} else {
				delete row.shuffleGroup;
			}
		},
		updateRowCondition: (
			state,
			action: GenericAction<{ rowUid: string; condition: string }>
		) => {
			const row = state.spreadsheet.rows.find((r) => r.uid === action.payload.rowUid);
			if (!row) return;
			const cleaned = action.payload.condition.trim();
			if (cleaned) {
				row.condition = cleaned;
			} else {
				delete row.condition;
			}
		},
		setParticipantAssignment: (
			state,
			action: GenericAction<ParticipantAssignmentConfig | undefined>
		) => {
			state.participantAssignment = action.payload
				? structuredClone(action.payload)
				: undefined;
		},

		// ---- Reset ----

		reset: () => initialState,
	},
});

export const blockEditorActions = blockEditorSlice.actions;
export const blockEditorReducer = blockEditorSlice.reducer;
