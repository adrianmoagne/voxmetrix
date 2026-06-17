import { createContext, useState } from "react";

interface SearchContextProps {
	sidebarSearch: string;
	sidebarSearchChange: (value: string) => void;
}

const SearchContext = createContext<SearchContextProps>({
	sidebarSearch: "",
	sidebarSearchChange: () => {},
});

const SearchProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
	const [sidebarSearch, setSidebarSearch] = useState<string>("");

	const sidebarSearchChange = (value: string) => {
		setSidebarSearch(value);
	};

	return (
		<SearchContext.Provider value={{ sidebarSearch, sidebarSearchChange }}>
			{children}
		</SearchContext.Provider>
	);
};

export { SearchContext, SearchProvider };
