import { Box, Button, Paper, TextField, Typography } from "@mui/material";
import { useSetAtom } from "jotai";
import { useState } from "react";
import { authAtom } from "./atoms";

export default function Login() {
	const [secret, setSecret] = useState("");
	const setAuth = useSetAtom(authAtom);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (secret.trim()) {
			setAuth(secret.trim());
		}
	};

	return (
		<Box
			sx={{
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				minHeight: "100vh",
			}}
		>
			<Paper sx={{ p: 4, maxWidth: 400, width: "100%" }}>
				<Typography variant="h5" sx={{ mb: 3 }}>
					Login
				</Typography>
				<Box component="form" onSubmit={handleSubmit}>
					<TextField
						fullWidth
						type="password"
						label="Secret"
						value={secret}
						onChange={(e) => setSecret(e.target.value)}
						autoFocus
						sx={{ mb: 2 }}
					/>
					<Button type="submit" variant="contained" fullWidth>
						Login
					</Button>
				</Box>
			</Paper>
		</Box>
	);
}
