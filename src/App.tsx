import { Box, createTheme, CssBaseline, ThemeProvider } from "@mui/material";
import Form from "./Form";

const theme = createTheme({
  palette: { mode: "dark" },
});
function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
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
    </ThemeProvider>
  );
}

export default App;
