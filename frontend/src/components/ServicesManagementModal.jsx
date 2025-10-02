import React, { useState, useEffect, useCallback } from "react";
import {
	Modal,
	Box,
	Typography,
	Button,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Paper,
	CircularProgress,
	IconButton,
	Select,
	MenuItem,
	FormControl,
	InputLabel,
} from "@mui/material";
import { Delete as DeleteIcon } from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";

const modalStyle = {
	position: "absolute",
	top: "50%",
	left: "50%",
	transform: "translate(-50%, -50%)",
	width: { xs: "90%", sm: 700 },
	bgcolor: "background.paper",
	boxShadow: 24,
	p: 4,
	borderRadius: 2,
};

const ServicesManagementModal = ({ open, onClose, booking, hotelId }) => {
	const { getServicesForBooking, getServiceTypes, addService, removeService } =
		useAuth();
	const { t } = useTranslation();
	const [services, setServices] = useState([]);
	const [serviceTypes, setServiceTypes] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [newServiceId, setNewServiceId] = useState("");

	const fetchServicesData = useCallback(async () => {
		if (!booking) return;
		setLoading(true);
		try {
			const [bookingServices, allServiceTypes] = await Promise.all([
				getServicesForBooking(booking.id),
				getServiceTypes(hotelId),
			]);
			setServices(bookingServices);
			setServiceTypes(allServiceTypes);
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	}, [booking, hotelId, getServicesForBooking, getServiceTypes]);

	useEffect(() => {
		if (open) {
			fetchServicesData();
		}
	}, [open, fetchServicesData]);

	const handleAddService = async () => {
		if (!newServiceId) return;
		try {
			const serviceToAdd = serviceTypes.find((st) => st.id === newServiceId);
			if (!serviceToAdd) return;

			// Add the service to the booking
			await addService({
				booking_id: booking.id,
				service_id: newServiceId,
			});

			// Refresh the data
			fetchServicesData();
			setNewServiceId("");
		} catch (err) {
			setError(err.message);
		}
	};

	const handleRemoveService = async (service) => {
		try {
			const serviceType = serviceTypes.find(
				(st) => st.id === service.service_id
			);
			if (!serviceType) return;

			// Remove the service
			await removeService(service.id);

			// Refresh the data
			fetchServicesData();
		} catch (err) {
			setError(err.message);
		}
	};

	const getServiceNameAndPrice = (serviceId) => {
		const type = serviceTypes.find((st) => st.id === serviceId);
		return type
			? { name: type.service, price: type.price }
			: { name: "Unknown", price: "0.00" };
	};

	return (
		<Modal open={open} onClose={onClose}>
			<Box sx={modalStyle}>
				<Typography variant="h6" gutterBottom>
					{t("manage_services_for_booking", {
						bookingId: booking?.id,
					})}
				</Typography>
				{loading ? (
					<CircularProgress />
				) : (
					<TableContainer component={Paper} sx={{ mt: 2 }}>
						<Table>
							<TableHead>
								<TableRow>
									<TableCell>{t("service")}</TableCell>
									<TableCell align="right">{t("price")}</TableCell>
									<TableCell align="right">{t("actions")}</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{services.map((service) => {
									const { name, price } = getServiceNameAndPrice(
										service.service_id
									);
									return (
										<TableRow key={service.id}>
											<TableCell>{name}</TableCell>
											<TableCell align="right">{price}</TableCell>
											<TableCell align="right">
												<IconButton
													onClick={() => handleRemoveService(service)}
												>
													<DeleteIcon />
												</IconButton>
											</TableCell>
										</TableRow>
									);
								})}
								{/* Row to add new service */}
								<TableRow>
									<TableCell>
										<FormControl fullWidth size="small">
											<InputLabel>{t("add_service")}</InputLabel>
											<Select
												value={newServiceId}
												label={t("add_service")}
												onChange={(e) => setNewServiceId(e.target.value)}
											>
												{serviceTypes.map((type) => (
													<MenuItem key={type.id} value={type.id}>
														{type.service} ({type.price})
													</MenuItem>
												))}
											</Select>
										</FormControl>
									</TableCell>
									<TableCell colSpan={2} align="right">
										<Button variant="contained" onClick={handleAddService}>
											{t("add")}
										</Button>
									</TableCell>
								</TableRow>
							</TableBody>
						</Table>
					</TableContainer>
				)}
				{error && (
					<Typography color="error" sx={{ mt: 2 }}>
						{error}
					</Typography>
				)}
			</Box>
		</Modal>
	);
};

export default ServicesManagementModal;
