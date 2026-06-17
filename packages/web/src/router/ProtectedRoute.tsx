import { api } from "@/api/api";
import { Endpoints } from "@/api/endpoints";
import { useEffect, useState } from "react";
import { Navigate } from "react-router";
import { Pages } from "@/@types";
import { Spinner } from "@leux/ui";
type Props = {
	children?: React.ReactNode;
};

const ProtectedRoute: React.FC<Props> = ({ children }) => {
	const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

	useEffect(() => {
		api
			.get(Endpoints.Me)
			.then(() => {
				setIsAuthenticated(true);
			})
			.catch(() => {
				setIsAuthenticated(false);
			});
	}, []);
	return isAuthenticated === null ? (
		<div
			style={{
				position: "fixed",
				inset: 0,
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				background: "transparent",
				zIndex: 9999,
			}}
		>
			<Spinner size="large" />
		</div>
	) : isAuthenticated ? (
		children
	) : (
		<Navigate to={Pages.Login} />
	);
};

export default ProtectedRoute;
