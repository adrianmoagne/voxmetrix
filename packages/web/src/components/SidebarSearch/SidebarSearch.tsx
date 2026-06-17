import { useSearch } from "@/hooks";
import { sidebarActions, type StoreState } from "@/store";
import { Input } from "@leux/ui";
import { useState } from "react";
import { Search } from "react-feather";
import { useDispatch, useSelector } from "react-redux";
import S from "./SidebarSearch.styles";

const SidebarSearch: React.FC = () => {
	const { isCollapsed } = useSelector((state: StoreState) => state.sidebar);
	const { sidebarSearchChange } = useSearch();
	const [search, setSearch] = useState<string>("");
	const dispatch = useDispatch();

	const toggleSidebar = () => dispatch(sidebarActions.toggleSidebar());

	const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSearch(event.target.value);
	};

	const handleSearch = () => {
		sidebarSearchChange(search);
	};

	const toggleSearch = () => {
		if (isCollapsed && toggleSidebar) {
			toggleSidebar();
		} else {
			handleSearch();
		}
	};

	return (
		<S.Wrapper isCollapsed={isCollapsed}>
			{!isCollapsed && (
				<Input
					placeholder="Search"
					customStyles={{
						alignSelf: "stretch",
					}}
					inputProps={{
						onFocus: () => {
							if (isCollapsed && toggleSidebar) {
								toggleSidebar();
							}
						},
						onChange: handleSearchChange,
					}}
				></Input>
			)}
			<S.FloatingIcon onClick={toggleSearch} isCollapsed={isCollapsed}>
				<Search className="icon" size={16} />
			</S.FloatingIcon>
		</S.Wrapper>
	);
};

export default SidebarSearch;
