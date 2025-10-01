import React, { useState, useEffect, useCallback } from "react";
import {
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
	Modal,
	TextField,
	IconButton,
} from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";

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

const ServicesPage = () => {
	const { hotelId } = useParams();
	const { t } = useTranslation();
	const { getServices, addService, updateService, removeService } = useAuth();

	const [services, setServices] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [modalMode, setModalMode] = useState(null); // 'add', 'edit', 'delete'
	const [currentService, setCurrentService] = useState(null);
	const [formData, setFormData] = useState({
		service: "",
		booking_id: "",
		date: "",
		amount: "",
	});
	const [modalError, setModalError] = useState("");

	const fetchServices = useCallback(async () => {
		try {
			setLoading(true);
			const data = await getServices(hotelId);
			setServices(data);
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	}, [getServices, hotelId]);

	useEffect(() => {
		fetchServices();
	}, [fetchServices]);

	const handleOpenModal = (mode, service = null) => {
		setModalMode(mode);
		if (service) {
			setCurrentService(service);
			if (mode === "edit") {
				setFormData({
					service: service.service,
					booking_id: service.booking_id,
					date: service.date,
					amount: service.amount,
				});
			}
		} else {
			setCurrentService(null);
			setFormData({ service: "", booking_id: "", date: "", amount: "" });
		}
	};

	const handleCloseModal = () => {
		setModalMode(null);
		setModalError("");
	};

	const handleFormChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setModalError("");
		try {
			if (modalMode === "add") {
				const newService = await addService(formData);
				setServices([...services, newService]);
			} else if (modalMode === "edit" && currentService) {
				const res = await updateService(currentService.id, formData);
				setServices(
					services.map((s) => (s.id === currentService.id ? res.service : s))
				);
			}
			handleCloseModal();
		} catch (err) {
			setModalError(err.message);
		}
	};

	const handleDelete = async () => {
		if (!currentService) return;
		try {
			await removeService(currentService.id);
			setServices(services.filter((s) => s.id !== currentService.id));
			handleCloseModal();
		} catch (err) {
			setModalError(err.message);
		}
	};

	if (loading) {
		return <CircularProgress />;
	}

	if (error) {
		return <Typography color="error">{error}</Typography>;
	}

	return (
		<Box>
			<Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
				<Typography variant="h4">{t("services")}</Typography>
				<Button variant="contained" onClick={() => handleOpenModal("add")}>
					{t("add_new_service")}
				</Button>
			</Box>
			<TableContainer component={Paper}>
				<Table>
					<TableHead>
						<TableRow>
							<TableCell>{t("service")}</TableCell>
							<TableCell>{t("booking_id")}</TableCell>
							<TableCell>{t("date")}</TableCell>
							<TableCell align="right">{t("amount")}</TableCell>
							<TableCell align="right">{t("actions")}</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{services.map((service) => (
							<TableRow key={service.id}>
								<TableCell>{service.service}</TableCell>
								<TableCell>{service.booking_id}</TableCell>
								<TableCell>{service.date}</TableCell>
								<TableCell align="right">{service.amount}</TableCell>
								<TableCell align="right">
									<IconButton onClick={() => handleOpenModal("edit", service)}>
										<EditIcon />
									</IconButton>
									<IconButton
										color="error"
										onClick={() => handleOpenModal("delete", service)}
									>
										<DeleteIcon />
									</IconButton>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</TableContainer>

			{/* Add/Edit Modal */}
			<Modal
				open={modalMode === "add" || modalMode === "edit"}
				onClose={handleCloseModal}
			>
				<Box sx={modalStyle} component="form" onSubmit={handleSubmit}>
					<Typography variant="h6">
						{modalMode === "add" ? t("add_new_service") : t("edit_service")}
					</Typography>
					<TextField
						name="service"
						label={t("service")}
						value={formData.service}
						onChange={handleFormChange}
						fullWidth
						required
						margin="normal"
					/>
					<TextField
						name="booking_id"
						label={t("booking_id")}
						value={formData.booking_id}
						onChange={handleFormChange}
						fullWidth
						required
						margin="normal"
					/>
					<TextField
						name="date"
						label={t("date")}
						type="date"
						value={formData.date}
						onChange={handleFormChange}
						fullWidth
						required
						margin="normal"
						InputLabelProps={{ shrink: true }}
					/>
					<TextField
						name="amount"
						label={t("amount")}
						type="number"
						value={formData.amount}
						onChange={handleFormChange}
						fullWidth
						required
						margin="normal"
					/>
					{modalError && <Typography color="error">{modalError}</Typography>}
					<Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
						<Button onClick={handleCloseModal} sx={{ mr: 1 }}>
							{t("cancel")}
						</Button>
						<Button type="submit" variant="contained">
							{t("save")}
						</Button>
					</Box>
				</Box>
			</Modal>

			{/* Delete Modal */}
			<Modal open={modalMode === "delete"} onClose={handleCloseModal}>
				<Box sx={modalStyle}>
					<Typography variant="h6">{t("confirm_deletion")}</Typography>
					<Typography sx={{ mt: 2 }}>
						{t("delete_service_confirmation", {
							serviceName: currentService?.service,
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

export default ServicesPage;
