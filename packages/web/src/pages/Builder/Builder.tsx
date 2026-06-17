import { useI18nContext } from "@/i18n/i18n-react";
import { Badge, Box, Button, Typography, Table, Pagination } from "@leux/ui";
import S from "./Builder.styles";
import { buildsMock, type IBuild, Pages } from "@/@types";
import { format } from "date-fns";
import { useNavigate } from "react-router";

import { useState } from "react";
const Builder: React.FC = () => {
	const { LL } = useI18nContext();
	const [builds] = useState<IBuild[]>(buildsMock);
	const navigate = useNavigate();

	const handleNewClick = () => {
		navigate(Pages.ScreenBuilder.replace(":id", "new"));
	};
	return (
		<S.Container>
			<S.Header>
				<Box flex flexDirection="row" justifyContent="space-between" alignItems="center">
					<Typography variant="h3" textColor="textOne">
						{LL.Build.Title()}
					</Typography>
					<Button colorScheme="primary" onClick={handleNewClick}>
						{LL.Buttons.New()}
					</Button>
				</Box>
				<Typography textColor="placeholder" variant="caption">
					{LL.Build.Subtitle()}
				</Typography>
			</S.Header>
			<S.Filters>
				<Badge size="large" clickable colorScheme="secondary" variant="filled">
					{LL.Build.Filters.All()}
				</Badge>
				<Badge size="large" clickable>
					{LL.Build.Filters.Mine()}
				</Badge>
			</S.Filters>
			<Table.Root variant="bordered" height="100%">
				<Table.Header>
					<Table.HeaderRow>
						<Table.HeaderColumn>{LL.Build.Headers.ID()}</Table.HeaderColumn>
						<Table.HeaderColumn>{LL.Build.Headers.Alias()}</Table.HeaderColumn>
						<Table.HeaderColumn>{LL.Build.Headers.Participants()}</Table.HeaderColumn>
						<Table.HeaderColumn>{LL.Build.Headers.Experiments()}</Table.HeaderColumn>
						<Table.HeaderColumn>{LL.Build.Headers.UsedIn()}</Table.HeaderColumn>
						<Table.HeaderColumn>{LL.Build.Headers.CreatedAt()}</Table.HeaderColumn>
						<Table.HeaderColumn>{LL.Build.Headers.Actions()}</Table.HeaderColumn>
					</Table.HeaderRow>
				</Table.Header>
				<Table.Body>
					{builds.map((build) => (
						<Table.BodyRow key={build._id}>
							<Table.BodyCell>{build._id}</Table.BodyCell>
							<Table.BodyCell>{build.alias}</Table.BodyCell>
							<Table.BodyCell>{build.participants}</Table.BodyCell>
							<Table.BodyCell>{build.experiments}</Table.BodyCell>
							<Table.BodyCell>{build.used_in}</Table.BodyCell>
							<Table.BodyCell>
								{format(new Date(build.created_at), "dd/MM/yy HH:mm")}
							</Table.BodyCell>
							<Table.BodyCell>{build.actions}</Table.BodyCell>
						</Table.BodyRow>
					))}
				</Table.Body>
			</Table.Root>
			<Pagination
				currentPage={1}
				totalPages={10}
				itemsPerPage={10}
				totalItems={builds.length}
				showPageSizeChanger
			/>
		</S.Container>
	);
};

export default Builder;
