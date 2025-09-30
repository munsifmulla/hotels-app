import React, { useState, useEffect, useCallback } from "react";
import {
	Button,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Paper,
	Typography,
	CircularProgress,
	Box,
	Modal,
	TextField,
	IconButton,
} from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";

const modalStyle = {
	position: "absolute",
	top: "50%",
	left: "50%",
	transform: "translate(-50%, -50%)",
	width: 400,
	bgcolor: "background.paper",
	boxShadow: 24,
	p: 4,
	borderRadius: 2,
};

const RoomTypesPage = () => {
	const [roomTypes, setRoomTypes] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const { getRoomTypes, createRoomType, updateRoomType, deleteRoomType } =
		useAuth();
	const { t } = useTranslation();
	const { hotelId } = useParams();

	// State for modals
	const [modalMode, setModalMode] = useState(null); // 'add', 'edit', 'delete'
	const [currentRoomType, setCurrentRoomType] = useState(null);

	// State for form fields
	const [newTypeName, setNewTypeName] = useState("");
	const [newTypeDescription, setNewTypeDescription] = useState("");
	const [modalError, setModalError] = useState("");

	const fetchRoomTypes = useCallback(async () => {
		try {
			setLoading(true);
			setError("");
			const data = await getRoomTypes(hotelId);
			setRoomTypes(data);
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	}, [getRoomTypes, hotelId]);

	useEffect(() => {
		fetchRoomTypes();
	}, [fetchRoomTypes]);

	if (loading) {
		return (
			<Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
				<CircularProgress />
			</Box>
		);
	}

	const handleOpenModal = (mode, roomType = null) => {
		setModalMode(mode);
		setCurrentRoomType(roomType);
		if (mode === "edit" && roomType) {
			setNewTypeName(roomType.name);
			setNewTypeDescription(roomType.description);
		}
	};

	const handleCloseModal = () => {
		setModalMode(null);
		setCurrentRoomType(null);
		setNewTypeName("");
		setNewTypeDescription("");
		setModalError("");
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setModalError("");
		try {
			if (modalMode === "add") {
				const newRoomType = await createRoomType(
					hotelId,
					newTypeName,
					newTypeDescription
				);
				setRoomTypes((prev) => [...prev, newRoomType]);
			} else if (modalMode === "edit" && currentRoomType) {
				await updateRoomType(
					currentRoomType.id,
					newTypeName,
					newTypeDescription
				);
				setRoomTypes((prev) =>
					prev.map((rt) =>
						rt.id === currentRoomType.id
							? {
									...rt,
									name: newTypeName,
									description: newTypeDescription,
							  }
							: rt
					)
				);
			}
			handleCloseModal();
		} catch (err) {
			setModalError(err.message);
		}
	};

	const handleDelete = async () => {
		if (!currentRoomType) return;
		try {
			await deleteRoomType(currentRoomType.id);
			setRoomTypes((prev) => prev.filter((rt) => rt.id !== currentRoomType.id));
			handleCloseModal();
		} catch (err) {
			setModalError(err.message);
			// Keep modal open to show error
		}
	};

	if (loading) {
		return (
			<Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
				<CircularProgress />
			</Box>
		);
	}

	if (error) {
		return (
			<Typography color="error" sx={{ mt: 4, textAlign: "center" }}>
				Error: {error}
			</Typography>
		);
	}

	return (
		<Box>
			<Box
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					mb: 2,
				}}
			>
				<Typography variant="h4" gutterBottom>
					{t("room_types")}
				</Typography>
				<Button variant="contained" onClick={() => handleOpenModal("add")}>
					{t("add_new_room_type")}
				</Button>
			</Box>

			{roomTypes.length > 0 ? (
				<TableContainer component={Paper}>
					<Table>
						<TableHead>
							<TableRow>
								<TableCell>{t("name")}</TableCell>
								<TableCell>{t("description")}</TableCell>
								<TableCell align="right">{t("actions")}</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{roomTypes.map((type) => (
								<TableRow key={type.id}>
									<TableCell>{type.name}</TableCell>
									<TableCell>{type.description}</TableCell>
									<TableCell align="right">
										<IconButton onClick={() => handleOpenModal("edit", type)}>
											<EditIcon />
										</IconButton>
										<IconButton
											onClick={() => handleOpenModal("delete", type)}
											color="error"
										>
											<DeleteIcon />
										</IconButton>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</TableContainer>
			) : (
				<Typography sx={{ mt: 4, textAlign: "center" }}>
					{t("no_room_types_found")}
				</Typography>
			)}

			<Modal
				open={modalMode === "add" || modalMode === "edit"}
				onClose={handleCloseModal}
				aria-labelledby="add-room-type-modal-title"
			>
				<Box sx={modalStyle} component="form" onSubmit={handleSubmit}>
					<Typography
						id="add-room-type-modal-title"
						variant="h6"
						component="h2"
					>
						{modalMode === "add" ? t("add_new_room_type") : t("edit_room_type")}
					</Typography>
					<TextField
						margin="normal"
						required
						fullWidth
						label={t("room_type_name")}
						value={newTypeName}
						onChange={(e) => setNewTypeName(e.target.value)}
						autoFocus
					/>
					<TextField
						margin="normal"
						fullWidth
						label={t("description_optional")}
						multiline
						rows={3}
						value={newTypeDescription}
						onChange={(e) => setNewTypeDescription(e.target.value)}
					/>
					{modalError && <Typography color="error">{modalError}</Typography>}
					<Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
						<Button onClick={handleCloseModal} sx={{ mr: 1 }}>
							{t("cancel")}
						</Button>
						<Button type="submit" variant="contained" disabled={loading}>
							{modalMode === "add" ? t("create") : t("save")}
						</Button>
					</Box>
				</Box>
			</Modal>

			<Modal
				open={modalMode === "delete"}
				onClose={handleCloseModal}
				aria-labelledby="delete-room-type-modal-title"
			>
				<Box sx={modalStyle}>
					<Typography
						id="delete-room-type-modal-title"
						variant="h6"
						component="h2"
					>
						{t("confirm_deletion")}
					</Typography>
					<Typography sx={{ mt: 2 }}>
						{t("delete_confirmation_message", {
							name: currentRoomType?.name,
						})}
					</Typography>
					{modalError && <Typography color="error">{modalError}</Typography>}
					<Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
						<Button onClick={handleCloseModal} sx={{ mr: 1 }}>
							{t("cancel")}
						</Button>
						<Button onClick={handleDelete} variant="contained" color="error">
							{t("delete")}
						</Button>
					</Box>
				</Box>
			</Modal>
		</Box>
	);
};

export default RoomTypesPage;
