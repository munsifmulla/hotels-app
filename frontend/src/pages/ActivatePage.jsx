import React, { useState } from "react";
import {
	Container,
	Paper,
	Box,
	Typography,
	TextField,
	Button,
	CircularProgress,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ActivatePage = () => {
	const { t } = useTranslation();
	const [activationKey, setActivationKey] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const { activateKey } = useAuth();
	const navigate = useNavigate();

	const handleSubmit = async (event) => {
		event.preventDefault();
		if (!activationKey.trim()) {
			setError(t("activation_key_empty"));
			return;
		}
		setLoading(true);
		setError("");
		setSuccess("");
		try {
			const data = await activateKey(activationKey);
			setSuccess(data.message);
			setTimeout(() => {
				navigate("/");
			}, 5000);
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Container component="main" maxWidth="sm">
			<Paper
				elevation={3}
				sx={{
					mt: 8,
					p: 4,
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
				}}
			>
				<Typography component="h1" variant="h5">
					{t("activate")}
				</Typography>
				<Box
					component="form"
					onSubmit={handleSubmit}
					sx={{ mt: 1, width: "100%" }}
				>
					<TextField
						margin="normal"
						required
						fullWidth
						id="activationKey"
						label={t("app_activation_key")}
						name="activationKey"
						autoFocus
						multiline
						rows={4}
						value={activationKey}
						onChange={(e) => setActivationKey(e.target.value)}
						sx={{
							"& .MuiInputBase-root": {
								resize: "none",
							},
						}}
					/>
					{success && (
						<Typography color="green" sx={{ mt: 2, textAlign: "center" }}>
							{success} {t("redirecting")}
						</Typography>
					)}
					{error && <Typography color="error">{error}</Typography>}
					<Button
						type="submit"
						fullWidth
						variant="contained"
						sx={{ mt: 3, mb: 2 }}
						disabled={loading || success}
					>
						{loading ? <CircularProgress size={24} /> : t("activate")}
					</Button>
				</Box>
			</Paper>
		</Container>
	);
};

export default ActivatePage;
