import { Table, Typography, Button, Box, Dropdown } from "@leux/ui";
import { useEffect, useState } from "react";
import S from "./Projects.styles";
import { useNavigate, useParams } from "react-router";
import type { IExperiment, IProject } from "@/@types";
import { Pages } from "@/@types";
import type { StoreDispatch, StoreState } from "@/store";
import { useDispatch, useSelector } from "react-redux";
import { duplicateExperiment, projectActions } from "@/store";
import { AlertCircle, Copy, Trash2 } from "react-feather";
import { IconButton } from "@/components";
import { useTheme } from "@emotion/react"
import { useModal } from "@leux/ui";
import { ModalId, ModalSizes } from "@/@types";
import { Modals } from "@/components";


const ProjectDetail: React.FC = () => {
	const params = useParams();
	const navigate = useNavigate();
	const projectId = params.id as string;
	const { projects, loading, duplicating } = useSelector((state: StoreState) => state.project);
	const project = projects.find((p: IProject) => p._id === projectId);
	const dispatch = useDispatch<StoreDispatch>();
	const theme = useTheme();
	const { createModal } = useModal();
	const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

	useEffect(() => {
		dispatch(projectActions.fetchProjects());
	}, [dispatch]);


	const openInvitationModal = (experimentID: string, experimentName: string) => {
		createModal({
			id: ModalId.InviteParticipants,
			title: "Invite Participants",
			children: <Modals.InviteParticipantsModal.Content experimentId={experimentID} experimentName={experimentName} />,
			width: ModalSizes.InviteParticipants,
			footer: null,
		});
	};

	const handleDuplicate = async (experimentId: string) => {
		setDuplicatingId(experimentId);
		const result = await dispatch(
			projectActions.duplicateExperiment({ experimentId, projectId })
		);
		setDuplicatingId(null);

		if (duplicateExperiment.fulfilled.match(result)) {
			navigate(Pages.Experiment.replace(":id", result.payload.newId));
		}
	};

	if (loading || projects.length === 0) {
		return (
			<S.Container>
				<Typography variant="h3" textColor="textOne">
					Loading…
				</Typography>
			</S.Container>
		);
	}

	if (!project) {
		return (
			<S.Container>
				<Typography variant="h3" textColor="danger">
					Project not found
				</Typography>
			</S.Container>
		);
	}
	return (
		<S.Container>
			<Box flex flexDirection="row" justifyContent="space-between" alignItems="center">
				<Typography variant="h3" textColor="textOne">
					{project.alias}
				</Typography>
				<Button
					colorScheme="primary"
					onClick={() => navigate(Pages.ProjectExperimentCreate.replace(":id", project._id))}
				>
					New Experiment
				</Button>
			</Box>
			<Typography variant="h6" textColor="textOne">
				{project.description}
			</Typography>

			<Table.Root variant="bordered" height="auto" size="medium">
				<Table.Header>
					<Table.HeaderRow>
						<Table.HeaderColumn>Alias</Table.HeaderColumn>
						<Table.HeaderColumn>Description</Table.HeaderColumn>
						<Table.HeaderColumn>Status</Table.HeaderColumn>
						<Table.HeaderColumn>Created At</Table.HeaderColumn>
						<Table.HeaderColumn>Actions</Table.HeaderColumn>

					</Table.HeaderRow>
				</Table.Header>
				<Table.Body>
					{project.experiments.length > 0 &&
						project.experiments.map((exp: IExperiment) => (
							<Table.BodyRow key={exp._id} onClick={() => navigate(Pages.Experiment.replace(":id", exp._id))} clickable={true}

							>
								<Table.BodyCell>{exp.alias}</Table.BodyCell>
								<Table.BodyCell>{exp.description || "---"}</Table.BodyCell>
								<Table.BodyCell>{exp.status || "---"}</Table.BodyCell>
								<Table.BodyCell>{new Date(exp.createdAt).toLocaleString()}</Table.BodyCell>
								<Table.BodyCell>
									<S.Cell
										onClick={(e: React.MouseEvent) => e.stopPropagation()}
									>
										<Dropdown.Root
											variant="outlined"
											anchor={
												<IconButton>
													<AlertCircle size={20} color={theme.main.tertiary} fill={theme.main.tertiaryGhost} />
												</IconButton>
											}>
											<Dropdown.Item
												onClick={() => {
													void handleDuplicate(exp._id);
												}}
												disabled={duplicating || duplicatingId === exp._id}
											>
												<Copy color={theme.main.tertiary} size={20} />
												Duplicate
											</Dropdown.Item>
											<Dropdown.Item

												onClick={
													() => {
														dispatch(projectActions.deleteExperiment(exp._id));
													}
												}
											>
												<Trash2 color={theme.main.danger} size={20} />

											</Dropdown.Item>
											<Dropdown.Item
												onClick={() => {
													openInvitationModal(exp._id, exp.alias);
												}}
											>
												Invite Participants
											</Dropdown.Item>



										</Dropdown.Root>
									</S.Cell>
								</Table.BodyCell>

							</Table.BodyRow>
						))}
				</Table.Body>
			</Table.Root>
		</S.Container>
	);
};

export default ProjectDetail;