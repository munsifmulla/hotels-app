import React, { useState, useEffect } from "react";
import {
	Modal,
	Box,
	Typography,
	TextField,
	Button,
	CircularProgress,
	Grid,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
} from "@mui/material";
import { useAuth } from "../context/AuthContext";
import PrintableInvoice from "./PrintableInvoice";
import { useTranslation } from "react-i18next";

const modalStyle = {
	position: "absolute",
	top: "50%",
	left: "50%",
	transform: "translate(-50%, -50%)",
	width: { xs: "90%", sm: 600 },
	bgcolor: "background.paper",
	boxShadow: 24,
	p: 4,
	borderRadius: 2,
	maxHeight: "90vh",
	overflowY: "auto",
};

const InvoiceModal = ({ open, onClose, booking, room, existingInvoice }) => {
	const { t } = useTranslation();
	const [discount, setDiscount] = useState(0);
	const [vatPercent, setVatPercent] = useState(0); // Default TAX
	const [modeOfPayment, setModeOfPayment] = useState("Cash");
	const [transactionNumber, setTransactionNumber] = useState("");
	const [finalAmount, setFinalAmount] = useState(0);
	const [vatAmount, setVatAmount] = useState(0);
	const [grandTotal, setGrandTotal] = useState(0);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [generatedInvoice, setGeneratedInvoice] = useState(null);
	const [guestDetails, setGuestDetails] = useState(null);
	const [servicesTotal, setServicesTotal] = useState(0);
	const [detailedServices, setDetailedServices] = useState([]);
	const {
		createInvoice,
		getGuest,
		updateBooking,
		getServicesForBooking,
		getServiceTypes,
	} = useAuth();

	useEffect(() => {
		// If an invoice is passed in, set it and skip calculations
		if (existingInvoice) {
			setGeneratedInvoice(existingInvoice);
		}

		const fetchGuest = async () => {
			if (booking?.guest_id) {
				try {
					const guestData = await getGuest(booking.guest_id);
					setGuestDetails(guestData);
				} catch (err) {
					console.error("Failed to fetch guest details:", err);
				}
			}
		};
		fetchGuest();

		const fetchServices = async () => {
			if (booking?.id) {
				const bookingServices = await getServicesForBooking(booking.id);
				const serviceTypes = await getServiceTypes(booking.hotel_id);
				const serviceTypeMap = new Map(serviceTypes.map((st) => [st.id, st]));

				const detailed = bookingServices.map((s) => ({
					...s,
					name: serviceTypeMap.get(s.service_id)?.service || "Unknown",
					price: serviceTypeMap.get(s.service_id)?.price || "0.00",
				}));
				setDetailedServices(detailed);

				const total = bookingServices.reduce((acc, service) => {
					const type = serviceTypeMap.get(service.service_id);
					return acc + (type ? parseFloat(type.price) : 0);
				}, 0);
				setServicesTotal(total);
			}
		};
		fetchServices();

		if (booking) {
			const basePrice = parseFloat(booking.total_price) || 0;
			const servicesPrice = parseFloat(servicesTotal) || 0;
			const total = basePrice + servicesPrice;

			const disc = parseFloat(discount) || 0;
			const final = total - disc;
			const vatP = parseFloat(vatPercent) || 0;
			const vat = final * (vatP / 100);
			const advance = parseFloat(booking.advance_amount) || 0;
			const grand = final + vat - advance;

			setFinalAmount(final.toFixed(2));
			setVatAmount(vat.toFixed(2));
			setGrandTotal(grand.toFixed(2));
		}
	}, [
		booking,
		discount,
		vatPercent,
		getGuest,
		existingInvoice,
		servicesTotal,
		getServicesForBooking,
		getServiceTypes,
	]);

	const handleGenerateInvoice = async () => {
		setLoading(true);
		setError("");
		try {
			const invoiceData = {
				booking_id: booking.id,
				total_amount: (parseFloat(booking.total_price) + servicesTotal).toFixed(
					2
				),
				discount: discount,
				final_amount: finalAmount,
				vat_percent: vatPercent,
				vat_amount: vatAmount,
				mode_of_payment: modeOfPayment,
				transaction_number: transactionNumber,
			};
			const newInvoice = await createInvoice(invoiceData);
			// After creating the invoice, update the booking status
			await updateBooking(booking.id, { status: "checked-out" });
			setGeneratedInvoice(newInvoice);
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	const handleClose = () => {
		onClose();
		setTimeout(() => {
			setGeneratedInvoice(null);
			setDiscount(0);
			setVatPercent(15);
			setModeOfPayment("Cash");
			setTransactionNumber("");
			setError("");
		}, 300);
	};

	return (
		<Modal open={open} onClose={handleClose}>
			<Box sx={modalStyle}>
				{generatedInvoice ? (
					<PrintableInvoice
						guest={guestDetails}
						invoice={generatedInvoice}
						booking={booking}
						room={room}
						services={detailedServices}
						onClose={handleClose}
					/>
				) : (
					<>
						<Typography variant="h6" gutterBottom>
							Generate Invoice for Booking #{booking?.id}
						</Typography>
						<Grid container spacing={2} sx={{ mt: 2 }}>
							<Grid item xs={12}>
								<TextField
									label="Total Amount"
									value={(
										(parseFloat(booking?.total_price) || 0) + servicesTotal
									).toFixed(2)}
									fullWidth
									InputProps={{ readOnly: true }}
								/>
							</Grid>
							<Grid item xs={12} sm={6}>
								<TextField
									label="Discount"
									type="number"
									value={discount}
									onChange={(e) => setDiscount(e.target.value)}
									fullWidth
								/>
							</Grid>
							<Grid item xs={12} sm={6}>
								<TextField
									label="Final Amount"
									value={finalAmount}
									fullWidth
									InputProps={{ readOnly: true }}
								/>
							</Grid>
							<Grid item xs={12} sm={6}>
								<TextField
									label={t("vat_percent_label", { percent: "" })}
									type="number"
									value={vatPercent}
									onChange={(e) => setVatPercent(e.target.value)}
									fullWidth
								/>
							</Grid>
							<Grid item xs={12} sm={6}>
								<TextField
									label={t("vat_amount")}
									value={vatAmount}
									fullWidth
									InputProps={{ readOnly: true }}
								/>
							</Grid>
							<Grid item xs={12}>
								<TextField
									label={t("advance_amount")}
									value={booking?.advance_amount || "0.00"}
									fullWidth
									InputProps={{ readOnly: true }}
									color="success"
								/>
							</Grid>
							<Grid item xs={12} sm={6}>
								<FormControl fullWidth>
									<InputLabel>Mode of Payment</InputLabel>
									<Select
										value={modeOfPayment}
										label="Mode of Payment"
										onChange={(e) => setModeOfPayment(e.target.value)}
									>
										<MenuItem value="Cash">Cash</MenuItem>
										<MenuItem value="Online">Online</MenuItem>
									</Select>
								</FormControl>
							</Grid>
							<Grid item xs={12} sm={6}>
								{modeOfPayment === "Online" && (
									<TextField
										label="Transaction Number"
										value={transactionNumber}
										onChange={(e) => setTransactionNumber(e.target.value)}
										fullWidth
										required
									/>
								)}
							</Grid>
						</Grid>
						<Typography variant="h5" sx={{ mt: 2, textAlign: "right" }}>
							{t("grand_total_label")} {grandTotal}
						</Typography>
						{error && (
							<Typography color="error" sx={{ mt: 2 }}>
								{error}
							</Typography>
						)}
						<Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
							<Button onClick={handleClose} sx={{ mr: 1 }}>
								Cancel
							</Button>

							<Button
								onClick={handleGenerateInvoice}
								variant="contained"
								disabled={loading}
							>
								{loading ? <CircularProgress size={24} /> : "Generate Invoice"}
							</Button>
						</Box>
					</>
				)}
			</Box>
		</Modal>
	);
};

export default InvoiceModal;
