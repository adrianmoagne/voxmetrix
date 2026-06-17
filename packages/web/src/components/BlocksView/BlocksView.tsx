import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Menu, Plus, Trash2, Edit3, ChevronDown, ChevronRight, Monitor } from "react-feather";
import type { StepEntity } from "@/@types/screen.model";
import { blockEditorActions, type StoreDispatch, type StoreState } from "@/store";
import { StepCatalogStyles as SC, STEP_ICON, STEP_LABEL, STEP_DESCRIPTION, CATALOG_STEPS, stepColors, makeStep } from "@/components/StepCatalog";
import S from "./BlocksView.styles";
import { Dropdown, Typography } from "@leux/ui";

type Props = {
	onEditStep: (blockUid: string, stepUid: string) => void;
};

const BlocksView: React.FC<Props> = ({ onEditStep }) => {
	const dispatch = useDispatch<StoreDispatch>();
	const { blocks } = useSelector((s: StoreState) => s.blockEditor);
	const [collapsedBlocks, setCollapsedBlocks] = useState<Set<string>>(new Set());

	const toggleBlock = (uid: string) => {
		const next = new Set(collapsedBlocks);
		if (next.has(uid)) next.delete(uid);
		else next.add(uid);
		setCollapsedBlocks(next);
	};

	const handleAddStep = (blockUid: string, kind: StepEntity["kind"]) => {
		dispatch(blockEditorActions.selectBlock(blockUid));
		const step = makeStep(kind);
		dispatch(blockEditorActions.addStep(step));
		if (kind === "Screen") onEditStep(blockUid, step.uid);
	};

	const handleDeleteStep = (blockUid: string, stepUid: string) => {
		dispatch(blockEditorActions.selectBlock(blockUid));
		dispatch(blockEditorActions.removeStep(stepUid));
	};

	return (
		<S.Content>
			{blocks.map((block) => {
				const isCollapsed = collapsedBlocks.has(block.uid);
				return (
					<S.BlockCard key={block.uid}>
						<S.BlockHeader>
							<S.IconButton onClick={() => toggleBlock(block.uid)}>
								{isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
							</S.IconButton>

							<S.DragHandle className="hover-action">
								<Menu size={16} />
							</S.DragHandle>

							<S.NameInput
								value={block.name}
								onChange={(e) =>
									dispatch(blockEditorActions.renameBlock({ uid: block.uid, name: e.target.value }))
								}
								placeholder="Block Name"
							/>
							{blocks.length > 1 && (
								<S.IconButton
									className="hover-action danger"
									onClick={() => dispatch(blockEditorActions.removeBlock(block.uid))}
									title="Delete block"
								>
									<Trash2 size={16} />
								</S.IconButton>
							)}
						</S.BlockHeader>

						<S.CollapseContent $isOpen={!isCollapsed}>
							<S.StepsContainer>
								{block.steps.map((step) => {
									const Icon = STEP_ICON[step.kind] ?? Monitor;

									return (
										<S.StepRow key={step.uid} onClick={() => onEditStep(block.uid, step.uid)}>
											<S.DragHandle className="hover-action">
												<Menu size={14} />
											</S.DragHandle>

											<S.IconWrapper $kind={step.kind}>
												<Icon size={16} />
											</S.IconWrapper>

											<S.StepName>{step.name}</S.StepName>
											<S.TypeBadge $kind={step.kind}>{STEP_LABEL[step.kind]}</S.TypeBadge>

											<S.StepSpacer />

											{step.kind === "Screen" && (
												<S.SmallLabel className="hover-action" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
													<Edit3 size={12} /> Edit
												</S.SmallLabel>
											)}

											<S.IconButton
												className="hover-action danger"
												onClick={(e) => { e.stopPropagation(); handleDeleteStep(block.uid, step.uid); }}
												title="Delete step"
											>
												<Trash2 size={14} />
											</S.IconButton>
										</S.StepRow>
									);
								})}

								<Dropdown.Root
									anchor={
										<S.AddStepButton>
											<Plus size={16} /> Add Step
										</S.AddStepButton>
									}
									placement="bottom-start"
									customMenuStyles={{ background: "white" }}
								>
									{CATALOG_STEPS.map((kind) => {
										const Icon = STEP_ICON[kind] ?? Monitor;
										return (
											<Dropdown.Item
												key={kind}
												onClick={() => handleAddStep(block.uid, kind)}
												closeOnClick
												customStyles={{ textAlign: "left" }}
											>
												<div style={{ display: "flex", alignItems: "center", gap: 10 }}>
													<SC.ItemIcon $kind={kind}>
														<Icon size={14} color={stepColors[kind]?.icon} />
													</SC.ItemIcon>
													<div style={{ textAlign: "left" }}>
														<Typography variant="body-1">{STEP_LABEL[kind]}</Typography>
														<Typography variant="overline">{STEP_DESCRIPTION[kind]}</Typography>
													</div>
												</div>
											</Dropdown.Item>
										);
									})}
								</Dropdown.Root>
							</S.StepsContainer>
						</S.CollapseContent>
					</S.BlockCard>
				);
			})}

			<S.AddBlockButton onClick={() => dispatch(blockEditorActions.addBlock())}>
				<Plus size={18} /> Add Block
			</S.AddBlockButton>
		</S.Content>
	);
};

export default BlocksView;
