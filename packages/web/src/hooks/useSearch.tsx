import { SearchContext } from "@/providers";
import { useContext } from "react";

const useSearch = () => {
	const context = useContext(SearchContext);
	return context;
};

export default useSearch;
