import { useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useModal } from "@leux/ui";
import { Plus, X, ChevronUp, ChevronDown, Image as ImageIcon } from "react-feather";
import type { SpreadsheetDefinition } from "@/@types/screen.model";
import type { IMedia } from "@/@types";
import { ModalId, ModalSizes } from "@/@types";
import { Modals } from "@/components";
import { blockEditorActions, type StoreDispatch, type StoreState } from "@/store";
import S from "./SpreadsheetPanel.styles";

const SpreadsheetPanel: React.FC = () => {
	const dispatch = useDispatch<StoreDispatch>();
	const { createModal } = useModal();
	const { blocks, spreadsheet, selectedBlockUid } = useSelector((s: StoreState) => s.blockEditor);

	const [editingColKey, setEditingColKey] = useState<string | null>(null);
	const [newColKey, setNewColKey] = useState("");
	const [showNewCol, setShowNewCol] = useState(false);

	const shuffleMode = spreadsheet.shuffleMode ?? "none";
	const shuffleEnabled = shuffleMode === "within-group";

	const resolveInsertBlockUid = useCallback(
		(fallbackBlockUid?: string) => selectedBlockUid ?? fallbackBlockUid ?? blocks[0]?.uid,
		[blocks, selectedBlockUid]
	);

	const handleAddColumn = useCallback(() => {
		const key = newColKey.trim().replace(/\s+/g, "_").toLowerCase();
		if (!key) return;
		if (spreadsheet.columns.some((c) => c.key === key)) return;
		dispatch(blockEditorActions.addColumn({ key, type: "string" }));
		setNewColKey("");
		setShowNewCol(false);
	}, [newColKey, spreadsheet.columns, dispatch]);

	const handleRenameColumn = useCallback(
		(oldKey: string, newKey: string) => {
			const cleaned = newKey.trim().replace(/\s+/g, "_").toLowerCase();
			if (!cleaned || cleaned === oldKey) {
				setEditingColKey(null);
				return;
			}
			if (spreadsheet.columns.some((c) => c.key === cleaned && c.key !== oldKey)) {
				setEditingColKey(null);
				return;
			}
			dispatch(blockEditorActions.renameColumnKey({ oldKey, newKey: cleaned }));
			setEditingColKey(null);
		},
		[spreadsheet.columns, dispatch]
	);

	const handleOpenMediaFill = useCallback(
		(columnKey: string) => {
			const defaultBlockUid = selectedBlockUid ?? blocks[0]?.uid;
			if (!defaultBlockUid) return;
			createModal({
				id: ModalId.BulkMediaFill,
				title: "Fill column with media",
				width: ModalSizes.BulkMediaFill,
				footer: null,
				children: (
					<Modals.BulkMediaFillModal.Content
						columnKey={columnKey}
						blocks={blocks.map((b) => ({ uid: b.uid, name: b.name }))}
						defaultBlockUid={defaultBlockUid}
						onConfirm={(medias: IMedia[], blockUid: string) => {
							const values = medias.map((m) => m.src).filter(Boolean);
							if (values.length === 0) return;
							dispatch(
								blockEditorActions.bulkFillColumn({
									key: columnKey,
									values,
									blockUid,
								})
							);
						}}
					/>
				),
			});
		},
		[blocks, selectedBlockUid, createModal, dispatch]
	);

	const handleShuffleModeChange = useCallback(
		(mode: SpreadsheetDefinition["shuffleMode"]) => {
			dispatch(blockEditorActions.setShuffleMode(mode));
		},
		[dispatch]
	);

	const metaColumnCount = 5;
	const totalColumnCount = spreadsheet.columns.length + metaColumnCount + 1;

	return (
		<S.Wrapper>
			<S.Header>
				<S.Title>Experiment Data</S.Title>
				<S.ShuffleControls>
					<S.ShuffleLabel htmlFor="spreadsheet-shuffle-mode">Shuffle</S.ShuffleLabel>
					<S.ShuffleSelect
						id="spreadsheet-shuffle-mode"
						value={shuffleMode}
						onChange={(e) =>
							handleShuffleModeChange(e.target.value as SpreadsheetDefinition["shuffleMode"])
						}
					>
						<option value="none">Off (spreadsheet order)</option>
						<option value="within-group">Within group</option>
					</S.ShuffleSelect>
					<S.ShuffleHint>
						{shuffleEnabled
							? "Rows shuffle inside the same group. Mark calibration/setup rows as fixed so they stay in place."
							: "Turn on to randomize row order at runtime."}
					</S.ShuffleHint>
				</S.ShuffleControls>
				<S.Count>
					{spreadsheet.columns.length} columns &middot; {spreadsheet.rows.length} rows
				</S.Count>
			</S.Header>

			<S.TableScroll>
				<S.Table>
					<thead>
						<tr>
							<S.Th $sticky>#</S.Th>
							<S.Th>block</S.Th>
							<S.Th style={{ minWidth: 56, textAlign: "center" }}>fixed</S.Th>
							<S.Th style={{ minWidth: 100 }}>group</S.Th>
							<S.Th style={{ minWidth: 72 }}>cond</S.Th>
							{spreadsheet.columns.map((col) => (
								<S.Th key={col.key}>
									<S.ThContent>
										{editingColKey === col.key ? (
											<S.ColKeyInput
												autoFocus
												defaultValue={col.key}
												onBlur={(e) => handleRenameColumn(col.key, e.target.value)}
												onKeyDown={(e) => {
													if (e.key === "Enter")
														handleRenameColumn(col.key, e.currentTarget.value);
													if (e.key === "Escape") setEditingColKey(null);
												}}
											/>
										) : (
											<span
												style={{ cursor: "text" }}
												onDoubleClick={() => setEditingColKey(col.key)}
											>
												{col.key}
											</span>
										)}
										<S.ColFillBtn
											className="col-fill"
											onClick={() => handleOpenMediaFill(col.key)}
											title="Fill column from media library"
										>
											<ImageIcon size={11} />
										</S.ColFillBtn>
										<S.ColDeleteBtn
											className="col-delete"
											onClick={() => dispatch(blockEditorActions.removeColumn(col.key))}
											title="Remove column"
										>
											<X size={10} />
										</S.ColDeleteBtn>
									</S.ThContent>
								</S.Th>
							))}
							<S.AddColTh>
								{showNewCol ? (
									<S.NewColInput
										autoFocus
										value={newColKey}
										onChange={(e) => setNewColKey(e.target.value)}
										onBlur={() => {
											if (newColKey.trim()) handleAddColumn();
											else setShowNewCol(false);
										}}
										onKeyDown={(e) => {
											if (e.key === "Enter") handleAddColumn();
											if (e.key === "Escape") {
												setNewColKey("");
												setShowNewCol(false);
											}
										}}
										placeholder="column_key"
									/>
								) : (
									<S.AddColBtn onClick={() => setShowNewCol(true)} title="Add column">
										<Plus size={12} />
									</S.AddColBtn>
								)}
							</S.AddColTh>
						</tr>
					</thead>
					<tbody>
						{spreadsheet.rows.map((row, idx) => (
							<tr key={row.uid}>
								<S.Td $sticky>{idx + 1}</S.Td>
								<S.Td>
									<S.BlockSelect
										value={row.blockUid}
										onChange={(e) =>
											dispatch(
												blockEditorActions.updateRowBlock({
													rowUid: row.uid,
													blockUid: e.target.value,
												})
											)
										}
									>
										{blocks.map((block) => (
											<option key={block.uid} value={block.uid}>
												{block.name}
											</option>
										))}
									</S.BlockSelect>
								</S.Td>
								<S.Td>
									<S.MetaCell>
										<input
											type="checkbox"
											checked={row.fixed ?? false}
											disabled={!shuffleEnabled}
											title={
												shuffleEnabled
													? "Keep this row in its spreadsheet position"
													: "Enable shuffle to use fixed rows"
											}
											onChange={(e) =>
												dispatch(
													blockEditorActions.updateRowFixed({
														rowUid: row.uid,
														fixed: e.target.checked,
													})
												)
											}
										/>
									</S.MetaCell>
								</S.Td>
								<S.Td>
									<S.GroupInput
										value={row.shuffleGroup ?? ""}
										disabled={!shuffleEnabled}
										placeholder={shuffleEnabled ? "default" : "—"}
										title={
											shuffleEnabled
												? "Rows with the same group shuffle together"
												: "Enable shuffle to assign groups"
										}
										onChange={(e) =>
											dispatch(
												blockEditorActions.updateRowShuffleGroup({
													rowUid: row.uid,
													shuffleGroup: e.target.value,
												})
											)
										}
									/>
								</S.Td>
								<S.Td>
									<S.GroupInput
										value={row.condition ?? ""}
										placeholder="all"
										title="Leave empty for all participants; set A/B to restrict this row"
										onChange={(e) =>
											dispatch(
												blockEditorActions.updateRowCondition({
													rowUid: row.uid,
													condition: e.target.value,
												})
											)
										}
									/>
								</S.Td>
								{spreadsheet.columns.map((col) => (
									<S.Td key={col.key}>
										<S.CellInput
											value={row.values[col.key] ?? ""}
											onChange={(e) =>
												dispatch(
													blockEditorActions.updateCell({
														rowUid: row.uid,
														key: col.key,
														value: e.target.value,
													})
												)
											}
											placeholder="—"
										/>
									</S.Td>
								))}
								<S.ActionTd>
									<S.RowActions>
										<S.RowActionBtn
											type="button"
											className="row-action"
											title="Move row up"
											disabled={idx === 0}
											onClick={() =>
												dispatch(
													blockEditorActions.moveRow({
														rowUid: row.uid,
														direction: "up",
													})
												)
											}
										>
											<ChevronUp size={12} />
										</S.RowActionBtn>
										<S.RowActionBtn
											type="button"
											className="row-action"
											title="Move row down"
											disabled={idx === spreadsheet.rows.length - 1}
											onClick={() =>
												dispatch(
													blockEditorActions.moveRow({
														rowUid: row.uid,
														direction: "down",
													})
												)
											}
										>
											<ChevronDown size={12} />
										</S.RowActionBtn>
										<S.RowActionBtn
											type="button"
											className="row-action"
											title="Insert row below (uses selected block from Blocks tab, or this row's block)"
											onClick={() => {
												const targetBlock = resolveInsertBlockUid(row.blockUid);
												if (!targetBlock) return;
												dispatch(
													blockEditorActions.insertRow({
														blockUid: targetBlock,
														afterRowUid: row.uid,
													})
												);
											}}
										>
											<Plus size={12} />
										</S.RowActionBtn>
										<S.RowDeleteBtn
											className="row-delete"
											onClick={() => dispatch(blockEditorActions.removeRow(row.uid))}
											title="Remove row"
										>
											<X size={10} />
										</S.RowDeleteBtn>
									</S.RowActions>
								</S.ActionTd>
							</tr>
						))}

						<S.AddTrialRow>
							<S.AddTrialCell colSpan={totalColumnCount}>
								<S.AddTrialBtn
									onClick={() => {
										const targetBlock = selectedBlockUid ?? blocks[0]?.uid;
										if (targetBlock) dispatch(blockEditorActions.addRow(targetBlock));
									}}
								>
									<Plus size={11} />
									Add trial
								</S.AddTrialBtn>
							</S.AddTrialCell>
						</S.AddTrialRow>
					</tbody>
				</S.Table>
			</S.TableScroll>
		</S.Wrapper>
	);
};

export default SpreadsheetPanel;
