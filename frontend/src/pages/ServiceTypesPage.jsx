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

const ServiceTypesPage = () => {
	const { hotelId } = useParams();
	const { t } = useTranslation();
	const {
		getServiceTypes,
		createServiceType,
		updateServiceType,
		deleteServiceType,
	} = useAuth();

	const [serviceTypes, setServiceTypes] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [modalMode, setModalMode] = useState(null); // 'add', 'edit', 'delete'
	const [currentType, setCurrentType] = useState(null);
	const [formData, setFormData] = useState({ service: "", price: "" });
	const [modalError, setModalError] = useState("");

	const fetchData = useCallback(async () => {
		try {
			setLoading(true);
			const data = await getServiceTypes(hotelId);
			setServiceTypes(data);
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	}, [getServiceTypes, hotelId]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const handleOpenModal = (mode, type = null) => {
		setModalMode(mode);
		if (type) {
			setCurrentType(type);
			if (mode === "edit") {
				setFormData({ service: type.service, price: type.price });
			}
		} else {
			setCurrentType(null);
			setFormData({ service: "", price: "" });
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
				const newType = await createServiceType({
					hotel_id: hotelId,
					...formData,
				});
				setServiceTypes([...serviceTypes, newType]);
			} else if (modalMode === "edit" && currentType) {
				await updateServiceType(currentType.id, formData);
				fetchData(); // Re-fetch to get the updated list
			}
			handleCloseModal();
		} catch (err) {
			setModalError(err.message);
		}
	};

	const handleDelete = async () => {
		if (!currentType) return;
		try {
			await deleteServiceType(currentType.id);
			setServiceTypes(serviceTypes.filter((st) => st.id !== currentType.id));
			handleCloseModal();
		} catch (err) {
			setModalError(err.message);
		}
	};

	if (loading) return <CircularProgress />;
	if (error) return <Typography color="error">{error}</Typography>;

	return (
		<Box>
			<Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
				<Typography variant="h4">{t("service_types")}</Typography>
				<Button variant="contained" onClick={() => handleOpenModal("add")}>
					{t("add_new_service_type")}
				</Button>
			</Box>
			<TableContainer component={Paper}>
				<Table>
					<TableHead>
						<TableRow>
							<TableCell>{t("service")}</TableCell>
							<TableCell align="right">{t("price")}</TableCell>
							<TableCell align="right">{t("actions")}</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{serviceTypes.map((type) => (
							<TableRow key={type.id}>
								<TableCell>{type.service}</TableCell>
								<TableCell align="right">{type.price}</TableCell>
								<TableCell align="right">
									<IconButton onClick={() => handleOpenModal("edit", type)}>
										<EditIcon />
									</IconButton>
									<IconButton
										color="error"
										onClick={() => handleOpenModal("delete", type)}
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
						{modalMode === "add"
							? t("add_new_service_type")
							: t("edit_service_type")}
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
						name="price"
						label={t("price")}
						type="number"
						value={formData.price}
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
						{t("delete_service_type_confirmation", {
							serviceName: currentType?.service,
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

export default ServiceTypesPage;
