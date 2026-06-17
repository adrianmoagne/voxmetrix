import { useI18nContext } from "@/i18n/i18n-react";
import { Badge, Button, Pagination, Select, Table, Typography } from "@leux/ui";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import S from "./Forms.styles";
import { Pages, type IFormStatus } from "@/@types";
import { format } from "date-fns";
import type { StoreDispatch, StoreState } from "@/store";
import { formsActions } from "@/store/Slices/Forms.slice";
import { Edit2, Trash2 } from "react-feather";

type FilterType = "all" | "in_use" | IFormStatus;

const Forms: React.FC = () => {
	const { LL } = useI18nContext();
	const dispatch = useDispatch<StoreDispatch>();
	const navigate = useNavigate();
	const { forms = [], loading = false } = useSelector((state: StoreState) => state.forms) || {};

	const [filter, setFilter] = useState<FilterType>("all");
	const [statusFilter, setStatusFilter] = useState<IFormStatus | "">("");

	useEffect(() => {
		dispatch(formsActions.fetchForms());
	}, [dispatch]);

	const handleBuildClick = () => {
		navigate(Pages.FormBuilder);
	};

	const handleEditForm = (formId: string) => {
		navigate(Pages.FormBuilderEdit.replace(":id", formId));
	};

	const handleDeleteForm = async (formId: string) => {
		if (window.confirm("Are you sure you want to delete this form?")) {
			dispatch(formsActions.deleteForm(formId));
		}
	};

	const handleToggleStatus = (formId: string, currentStatus: IFormStatus) => {
		const newStatus: IFormStatus = currentStatus === "enabled" ? "disabled" : "enabled";
		dispatch(formsActions.updateForm({ formId, payload: { status: newStatus } }));
	};

	const filteredForms = (forms || []).filter((form) => {
		if (statusFilter && form.status !== statusFilter) {
			return false;
		}
		return true;
	});

	return (
		<S.Container>
			<S.Header>
				<S.RowBetween>
					<Typography variant="h3" textColor="textOne">
						{LL.Forms.Title()}
					</Typography>
					<Button colorScheme="primary" onClick={handleBuildClick}>
						{LL.Forms.Buttons.Build()}
					</Button>
				</S.RowBetween>
				<Typography variant="caption" textColor="placeholder">
					{LL.Forms.Subtitle()}
				</Typography>
			</S.Header>
			<S.Filters>
				<Badge
					size="large"
					clickable
					colorScheme={filter === "all" ? "secondary" : "default"}
					variant={filter === "all" ? "filled" : "ghost"}
					onClick={() => {
						setFilter("all");
						setStatusFilter("");
					}}
				>
					{LL.Forms.Filters.All()}
				</Badge>
				<Badge
					size="large"
					clickable
					colorScheme={filter === "in_use" ? "secondary" : "default"}
					variant={filter === "in_use" ? "filled" : "ghost"}
					onClick={() => setFilter("in_use")}
				>
					{LL.Forms.Filters.InUse()}
				</Badge>
				<Select
					options={[
						{ label: LL.Forms.Filters.All(), value: "" },
						{ label: LL.Forms.Filters.Enabled(), value: "enabled" },
						{ label: LL.Forms.Filters.Disabled(), value: "disabled" },
					]}
					placeholder={LL.Forms.Filters.Status()}
					onChange={(e) => setStatusFilter((e.target.value || "") as IFormStatus | "")}
				/>
			</S.Filters>
			{loading ? (
				<Typography variant="body-1" textColor="placeholder">
					Loading forms...
				</Typography>
			) : (
				<Table.Root variant="bordered" height="100%">
					<Table.Header>
						<Table.HeaderRow>
							<Table.HeaderColumn>{LL.Forms.Headers.Alias()}</Table.HeaderColumn>
							<Table.HeaderColumn>{LL.Forms.Headers.Items()}</Table.HeaderColumn>
							<Table.HeaderColumn>{LL.Forms.Headers.Status()}</Table.HeaderColumn>
							<Table.HeaderColumn>{LL.Forms.Headers.CreatedAt()}</Table.HeaderColumn>
							<Table.HeaderColumn>{LL.Forms.Headers.Actions()}</Table.HeaderColumn>
						</Table.HeaderRow>
					</Table.Header>
					<Table.Body>
						{filteredForms.length === 0 ? (
							<Table.BodyRow>
								<Table.BodyCell>
									<Typography variant="body-2" textColor="placeholder">
										No forms found. Click "Build" to create your first form.
									</Typography>
								</Table.BodyCell>
								<Table.BodyCell>{""}</Table.BodyCell>
								<Table.BodyCell>{""}</Table.BodyCell>
								<Table.BodyCell>{""}</Table.BodyCell>
								<Table.BodyCell>{""}</Table.BodyCell>
							</Table.BodyRow>
						) : (
							filteredForms.map((form) => (
								<Table.BodyRow key={form._id}>
									<Table.BodyCell>{form.alias}</Table.BodyCell>
									<Table.BodyCell>{form.inputs?.length ?? 0}</Table.BodyCell>
									<Table.BodyCell>
										<Badge
											clickable
											colorScheme={form.status === "enabled" ? "success" : "default"}
											variant="ghost"
											onClick={() => handleToggleStatus(form._id, form.status)}
										>
											{form.status}
										</Badge>
									</Table.BodyCell>
									<Table.BodyCell>
										{form.createdAt && !isNaN(new Date(form.createdAt).getTime())
											? format(new Date(form.createdAt), "dd/MM/yy HH:mm")
											: "-"}
									</Table.BodyCell>
									<Table.BodyCell>
										<S.ActionsRow>
											<Button
												variant="ghost"
												size="small"
												onClick={() => handleEditForm(form._id)}
											>
												<Edit2 size={16} />
											</Button>
											<Button
												variant="ghost"
												size="small"
												colorScheme="danger"
												onClick={() => handleDeleteForm(form._id)}
											>
												<Trash2 size={16} />
											</Button>
										</S.ActionsRow>
									</Table.BodyCell>
								</Table.BodyRow>
							))
						)}
					</Table.Body>
				</Table.Root>
			)}
			<Pagination
				currentPage={1}
				totalPages={Math.ceil(filteredForms.length / 10) || 1}
				itemsPerPage={10}
				totalItems={filteredForms.length}
				showPageSizeChanger
			/>
		</S.Container>
	);
};

export default Forms;
