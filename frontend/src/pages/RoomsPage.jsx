import React, { useState, useEffect, useCallback } from "react";
import {
	Grid,
	Typography,
	CircularProgress,
	Box,
	Button,
	Modal,
	TextField,
	Select,
	MenuItem,
	FormControl,
	InputLabel,
	FormControlLabel,
	Switch,
} from "@mui/material";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import RoomCard from "../components/RoomCard";
import BookingModal from "../components/BookingModal";

const RoomsPage = () => {
	const [rooms, setRooms] = useState([]);
	const [roomTypes, setRoomTypes] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const { getRooms, getRoomTypes, createRoom, updateRoom, deleteRoom } =
		useAuth();
	const { hotelId } = useParams();
	const { t } = useTranslation();

	const [modalMode, setModalMode] = useState(null); // 'add', 'edit', or 'delete'
	const [currentRoom, setCurrentRoom] = useState(null); // For edit, delete, and booking
	const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
	const [roomFormData, setRoomFormData] = useState({
		room_number: "",
		room_type_id: "",
		price_per_night: "",
		number_of_beds: 1,
		number_of_bathrooms: 1,
		has_tv: false,
		has_kitchen: false,
		has_fridge: false,
		has_ac: false,
	});
	const [modalError, setModalError] = useState("");

	const modalStyle = {
		position: "absolute",
		top: "50%",
		left: "50%",
		transform: "translate(-50%, -50%)",
		width: { xs: "90%", sm: 500 },
		bgcolor: "background.paper",
		boxShadow: 24,
		p: 4,
		borderRadius: 2,
	};

	const fetchPageData = useCallback(async () => {
		try {
			setLoading(true);
			setError("");
			const [roomsData, roomTypesData] = await Promise.all([
				getRooms(hotelId),
				getRoomTypes(hotelId),
			]);
			setRooms(roomsData);
			setRoomTypes(roomTypesData);
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	}, [getRooms, getRoomTypes, hotelId]);

	useEffect(() => {
		fetchPageData();
	}, [fetchPageData]);

	const handleOpenModal = (mode, room = null) => {
		setModalMode(mode);
		if (mode === "edit" && room) {
			setCurrentRoom(room);
			setRoomFormData(room);
		} else {
			setCurrentRoom(null);
			// For 'delete' mode, we also set currentRoom
			if (mode === "delete") setCurrentRoom(room);
		}
	};

	const handleOpenBookingModal = (room) => {
		setCurrentRoom(room);
		setIsBookingModalOpen(true);
	};

	const handleBookingModalClose = () => {
		setIsBookingModalOpen(false);
		fetchPageData(); // Refresh the room list
	};

	const handleCloseModal = () => {
		setModalMode(null);
		setModalError("");
		// Reset form
		setRoomFormData({
			room_number: "",
			room_type_id: "",
			price_per_night: "",
			number_of_beds: 1,
			number_of_bathrooms: 1,
			has_tv: false,
			has_kitchen: false,
			has_fridge: false,
			has_ac: false,
		});
	};

	const handleFormChange = (e) => {
		const { name, value, type, checked } = e.target;
		setRoomFormData((prev) => ({
			...prev,
			[name]: type === "checkbox" ? checked : value,
		}));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setModalError("");
		try {
			if (modalMode === "add") {
				const newRoom = await createRoom({
					hotel_id: hotelId,
					...roomFormData,
				});
				setRooms((prev) => [...prev, newRoom]);
			} else if (modalMode === "edit" && currentRoom) {
				await updateRoom(currentRoom.id, roomFormData);
				setRooms((prev) =>
					prev.map((r) =>
						r.id === currentRoom.id ? { ...r, ...roomFormData } : r
					)
				);
			}
			handleCloseModal();
		} catch (err) {
			setModalError(err.message);
		}
	};

	const handleDelete = async () => {
		if (!currentRoom) return;
		try {
			await deleteRoom(currentRoom.id);
			setRooms((prev) => prev.filter((r) => r.id !== currentRoom.id));
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
					{t("available_rooms")}
				</Typography>
				<Button variant="contained" onClick={() => handleOpenModal("add")}>
					{t("add_new_room")}
				</Button>
			</Box>
			{rooms.length > 0 ? (
				<Grid container spacing={3}>
					{rooms.map((room) => {
						const roomType = roomTypes.find(
							(rt) => rt.id === room.room_type_id
						);
						return (
							<Grid item key={room.id} xs={12} sm={6} md={4}>
								<RoomCard
									room={room}
									roomType={roomType}
									t={t}
									onEdit={() => handleOpenModal("edit", room)}
									onDelete={() => handleOpenModal("delete", room)}
									onBook={() => handleOpenBookingModal(room)}
								/>
							</Grid>
						);
					})}
				</Grid>
			) : (
				<Typography sx={{ mt: 4, textAlign: "center" }}>
					{t("no_rooms_found")}
				</Typography>
			)}

			{currentRoom && (
				<BookingModal
					open={isBookingModalOpen}
					onClose={handleBookingModalClose}
					room={currentRoom}
					hotelId={hotelId}
				/>
			)}

			<Modal
				open={modalMode === "add" || modalMode === "edit"}
				onClose={handleCloseModal}
			>
				<Box sx={modalStyle} component="form" onSubmit={handleSubmit}>
					<Typography variant="h6" component="h2">
						{modalMode === "add" ? t("add_new_room") : t("edit_room")}
					</Typography>
					<Grid container spacing={2} sx={{ mt: 1 }}>
						<Grid item xs={12} sm={6}>
							<TextField
								required
								fullWidth
								name="room_number"
								label={t("room_number")}
								value={roomFormData.room_number}
								onChange={handleFormChange}
								autoFocus
							/>
						</Grid>
						<Grid item xs={12} sm={6}>
							<FormControl sx={{ width: "195px" }} required>
								<InputLabel id="room-type-select-label">
									{t("select_room_type")}
								</InputLabel>
								<Select
									labelId="room-type-select-label"
									name="room_type_id"
									value={roomFormData.room_type_id}
									label={t("select_room_type")}
									onChange={handleFormChange}
								>
									{roomTypes.map((type) => (
										<MenuItem key={type.id} value={type.id}>
											{type.name}
										</MenuItem>
									))}
								</Select>
							</FormControl>
						</Grid>
						<Grid item xs={12}>
							<TextField
								required
								fullWidth
								name="price_per_night"
								label={t("price_per_night")}
								type="number"
								value={roomFormData.price_per_night}
								onChange={handleFormChange}
							/>
						</Grid>
						<Grid item xs={12} sm={6}>
							<TextField
								fullWidth
								name="number_of_beds"
								label={t("number_of_beds")}
								type="number"
								value={roomFormData.number_of_beds}
								onChange={handleFormChange}
							/>
						</Grid>
						<Grid item xs={12} sm={6}>
							<TextField
								fullWidth
								name="number_of_bathrooms"
								label={t("number_of_bathrooms")}
								type="number"
								value={roomFormData.number_of_bathrooms}
								onChange={handleFormChange}
							/>
						</Grid>
						<Grid item xs={6} sm={3}>
							<FormControlLabel
								control={
									<Switch
										name="has_tv"
										checked={!!+roomFormData.has_tv}
										onChange={handleFormChange}
									/>
								}
								label={t("tv")}
							/>
						</Grid>
						<Grid item xs={6} sm={3}>
							<FormControlLabel
								control={
									<Switch
										name="has_ac"
										checked={!!+roomFormData.has_ac}
										onChange={handleFormChange}
									/>
								}
								label={t("ac")}
							/>
						</Grid>
						<Grid item xs={6} sm={3}>
							<FormControlLabel
								control={
									<Switch
										name="has_kitchen"
										checked={!!+roomFormData.has_kitchen}
										onChange={handleFormChange}
									/>
								}
								label={t("kitchen")}
							/>
						</Grid>
						<Grid item xs={6} sm={3}>
							<FormControlLabel
								control={
									<Switch
										name="has_fridge"
										checked={!!+roomFormData.has_fridge}
										onChange={handleFormChange}
									/>
								}
								label={t("fridge")}
							/>
						</Grid>
					</Grid>
					{modalError && (
						<Typography color="error" sx={{ mt: 2 }}>
							{modalError}
						</Typography>
					)}
					<Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
						<Button onClick={handleCloseModal} sx={{ mr: 1 }}>
							{t("cancel")}
						</Button>
						<Button type="submit" variant="contained">
							{modalMode === "add" ? t("create") : t("save")}
						</Button>
					</Box>
				</Box>
			</Modal>

			<Modal open={modalMode === "delete"} onClose={handleCloseModal}>
				<Box sx={modalStyle}>
					<Typography variant="h6" component="h2">
						{t("confirm_room_deletion")}
					</Typography>
					<Typography sx={{ mt: 2 }}>
						{t("delete_room_confirmation_message", {
							roomNumber: currentRoom?.room_number,
						})}
					</Typography>
					{modalError && (
						<Typography color="error" sx={{ mt: 2 }}>
							{modalError}
						</Typography>
					)}
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

export default RoomsPage;
