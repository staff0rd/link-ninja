import { Box, CssBaseline, createTheme, ThemeProvider } from "@mui/material";
import { useAtomValue } from "jotai";
import { authAtom } from "./atoms";
import Form from "./Form";
import Login from "./Login";

const theme = createTheme({
	palette: { mode: "light" },
});

function App() {
	const isAuthenticated = useAtomValue(authAtom);

	return (
		<ThemeProvider theme={theme}>
			<CssBaseline />
			{isAuthenticated ? (
				<Box
					sx={{
						display: "flex",
						flexDirection: "column",
						width: "100%",
						height: "100%",
						margin: "0 auto",
						padding: 2,
						alignItems: "center",
					}}
				>
					<Form />
				</Box>
			) : (
				<Login />
			)}
		</ThemeProvider>
	);
}

export default App;
