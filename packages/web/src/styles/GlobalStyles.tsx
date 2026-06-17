import { injectGlobal } from "@emotion/css";

const cb = injectGlobal`
	#root {
		display: flex;
		flex: 1;
	}

	html {
		font-family: 'Montserrat', sans-serif;
		width: 100%;
		height: 100%;
	}

	body {
		display: flex;
		flex-direction: column;
		flex-direction: 1;
		width: 100%;
		height: 100%;
	}


	button, select, textarea, input {
		font-family: 'Montserrat', sans-serif;
	}

	* {
		box-sizing: border-box;
		margin: 0;
		outline: none;
	}

	.le-modal {
		gap: 0;
	}

	.le-modal--body {
		padding: 12px;
	}

	.le-modal--footer {
		padding: 0 !important;
	}

	.le-dropdown--anchor {
		width: 100%;
	}
	
`;

export default cb;
