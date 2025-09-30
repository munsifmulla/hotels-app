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
};

const InvoiceModal = ({ open, onClose, booking, existingInvoice }) => {
	const [discount, setDiscount] = useState(0);
	const [vatPercent, setVatPercent] = useState(15); // Default VAT
	const [modeOfPayment, setModeOfPayment] = useState("Cash");
	const [transactionNumber, setTransactionNumber] = useState("");
	const [finalAmount, setFinalAmount] = useState(0);
	const [vatAmount, setVatAmount] = useState(0);
	const [grandTotal, setGrandTotal] = useState(0);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [generatedInvoice, setGeneratedInvoice] = useState(null);
	const [guestDetails, setGuestDetails] = useState(null);
	const { createInvoice, getGuest } = useAuth();

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

		if (booking) {
			const total = parseFloat(booking.total_price);
			const disc = parseFloat(discount) || 0;
			const final = total - disc;
			const vatP = parseFloat(vatPercent) || 0;
			const vat = final * (vatP / 100);
			const grand = final + vat;

			setFinalAmount(final.toFixed(2));
			setVatAmount(vat.toFixed(2));
			setGrandTotal(grand.toFixed(2));
		}
	}, [booking, discount, vatPercent, getGuest, existingInvoice]);

	const handleGenerateInvoice = async () => {
		setLoading(true);
		setError("");
		try {
			const invoiceData = {
				booking_id: booking.id,
				total_amount: booking.total_price,
				discount: discount,
				final_amount: finalAmount,
				vat_percent: vatPercent,
				vat_amount: vatAmount,
				mode_of_payment: modeOfPayment,
				transaction_number: transactionNumber,
			};
			const newInvoice = await createInvoice(invoiceData);
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
									value={booking?.total_price || ""}
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
									label="VAT %"
									type="number"
									value={vatPercent}
									onChange={(e) => setVatPercent(e.target.value)}
									fullWidth
								/>
							</Grid>
							<Grid item xs={12} sm={6}>
								<TextField
									label="VAT Amount"
									value={vatAmount}
									fullWidth
									InputProps={{ readOnly: true }}
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
							Grand Total: {grandTotal}
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
