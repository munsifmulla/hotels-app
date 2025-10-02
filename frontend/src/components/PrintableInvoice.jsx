import React, { useRef } from "react";
import {
	Box,
	Typography,
	Divider,
	Button,
	List,
	ListItem,
	ListItemText,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
} from "@mui/material";
import { QRCodeSVG as QRCode } from "qrcode.react";
import { useReactToPrint } from "react-to-print";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";

const PrintableInvoice = ({ invoice, booking, guest, services, onClose }) => {
	const { t } = useTranslation();
	const componentRef = useRef();
	const { tokenPayload } = useAuth();
	const handlePrint = useReactToPrint({
		contentRef: componentRef,
	});
	if (!invoice || !booking || !guest || !services) return null;

	// Helper function to generate TLV (Tag-Length-Value) for ZATCA e-invoicing QR code
	const generateZatcaTlv = () => {
		const sellerName = tokenPayload?.data?.business_name || "Hotel Name"; // Tag 1
		const vatNumber = tokenPayload?.data?.trn_number || "123456789"; // Tag 2
		const timestamp = new Date(invoice.invoice_date).toISOString(); // Tag 3
		const invoiceTotal = (
			parseFloat(invoice.final_amount) + parseFloat(invoice.vat_amount)
		).toFixed(2); // Tag 4
		const vatTotal = invoice.vat_amount; // Tag 5

		const tags = [
			{ tag: 1, value: sellerName }, // Seller Name
			{ tag: 2, value: vatNumber }, // VAT Registration Number
			{ tag: 3, value: timestamp }, // Timestamp (ISO 8601)
			{ tag: 4, value: invoiceTotal }, // Invoice Total (with VAT)
			{ tag: 5, value: vatTotal }, // VAT Total
		];

		const textEncoder = new TextEncoder();

		let tlvHex = "";
		tags.forEach((tagItem) => {
			const tag = tagItem.tag;
			const value = tagItem.value;
			const valueBytes = textEncoder.encode(value);
			const length = valueBytes.length;

			tlvHex += tag.toString(16).padStart(2, "0"); // Tag
			tlvHex += length.toString(16).padStart(2, "0"); // Length
			tlvHex += Array.from(valueBytes)
				.map((b) => b.toString(16).padStart(2, "0"))
				.join(""); // Value in hex
		});
		return btoa(
			tlvHex
				.match(/\w{2}/g)
				.map((a) => String.fromCharCode(parseInt(a, 16)))
				.join("")
		);
	};

	return (
		<Box>
			<Box ref={componentRef} sx={{ p: 1, border: "1px solid #ccc", my: 2 }}>
				<Typography
					variant="h6"
					align="center"
					gutterBottom
					sx={{ fontSize: "0.7rem" }}
				>
					{t("invoice")}
				</Typography>
				<Typography
					variant="h6"
					color="primary"
					sx={{ fontWeight: "bold", fontSize: "1rem" }}
				>
					{tokenPayload?.data?.business_name}
				</Typography>
				<p style={{ fontSize: "0.8rem", margin: 0 }}>
					{tokenPayload?.data?.email}
				</p>
				<p style={{ fontSize: "0.8rem", margin: 0 }}>
					{tokenPayload?.data?.phone_number}
				</p>
				<p style={{ fontSize: "0.8rem", margin: 0 }}>
					{tokenPayload?.data?.address}
				</p>
				<p style={{ fontSize: "0.8rem", margin: 0 }}>
					{tokenPayload?.data?.trn_number}
				</p>
				<Divider sx={{ my: 2 }} />
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
					}}
				>
					<Typography sx={{ fontSize: "0.8rem" }}>
						<b>{t("invoice_number")}</b> {invoice.invoice_number}
					</Typography>
					<Typography sx={{ fontSize: "0.8rem" }}>
						<b>{t("invoice_date")}</b>{" "}
						{new Date(invoice.invoice_date).toLocaleDateString()}
					</Typography>
				</Box>
				<Box sx={{ mt: 1 }}>
					<Typography sx={{ fontSize: "0.8rem" }}>
						<b>{t("guest_name")}</b> {guest.first_name} {guest.last_name}
					</Typography>
					<Typography sx={{ fontSize: "0.8rem" }}>
						<b>{t("guest_email")}</b> {guest.email} {guest.last_name}
					</Typography>
					{guest.govt_id && (
						<Typography sx={{ fontSize: "0.8rem" }}>
							<b>{t("guest_id")}</b> {guest.govt_id}
						</Typography>
					)}
				</Box>
				<Box sx={{ mt: 2, display: "flex", justifyContent: "space-between" }}>
					<Typography>
						<b>{t("check_in_date")}</b>{" "}
						{new Date(booking.check_in_date).toLocaleDateString()}
					</Typography>
					<Typography>
						<b>{t("check_out_date")}</b>{" "}
						{new Date(booking.check_out_date).toLocaleDateString()}
					</Typography>
				</Box>
				<Divider sx={{ my: 2 }} />
				<TableContainer>
					<Table size="small">
						<TableHead>
							<TableRow>
								<TableCell sx={{ fontWeight: "bold" }}>
									{t("description_of_services")}
								</TableCell>
								<TableCell align="right" sx={{ fontWeight: "bold" }}>
									{t("qty")}
								</TableCell>
								<TableCell align="right" sx={{ fontWeight: "bold" }}>
									{t("rate")}
								</TableCell>
								<TableCell align="right" sx={{ fontWeight: "bold" }}>
									{t("amount")}
								</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							<TableRow>
								<TableCell>{t("room_charges")}</TableCell>
								<TableCell align="right">1</TableCell>
								<TableCell align="right">{booking.total_price}</TableCell>
								<TableCell align="right">{booking.total_price}</TableCell>
							</TableRow>
							{services.map((service) => (
								<TableRow key={service.id}>
									<TableCell>{service.name}</TableCell>
									<TableCell align="right">1</TableCell>
									<TableCell align="right">{service.price}</TableCell>
									<TableCell align="right">{service.price}</TableCell>
								</TableRow>
							))}
							<TableRow>
								<TableCell colSpan={2} />
								<TableCell align="right">{t("discount")}</TableCell>
								<TableCell align="right" sx={{ color: "error.main" }}>
									- {invoice.discount}
								</TableCell>
							</TableRow>
							<TableRow>
								<TableCell colSpan={2} />
								<TableCell align="right">{t("subtotal")}</TableCell>
								<TableCell align="right">{invoice.final_amount}</TableCell>
							</TableRow>
							<TableRow>
								<TableCell colSpan={2} />
								<TableCell align="right">
									{t("vat_percent_label", {
										percent: parseInt(invoice.vat_percent, 10),
									})}
								</TableCell>
								<TableCell align="right">{invoice.vat_amount}</TableCell>
							</TableRow>
							<TableRow>
								<TableCell colSpan={2} />
								<TableCell
									align="right"
									sx={{ fontWeight: "bold", fontSize: "1rem" }}
								>
									{t("grand_total")}
								</TableCell>
								<TableCell
									align="right"
									sx={{ fontWeight: "bold", fontSize: "1rem" }}
								>
									{t("currency")}{" "}
									{(
										parseFloat(invoice.final_amount) +
										parseFloat(invoice.vat_amount)
									).toFixed(2)}
								</TableCell>
							</TableRow>
						</TableBody>
					</Table>
				</TableContainer>

				<Box
					sx={{ mt: 4 }}
					display={"flex"}
					gap={2}
					alignItems={"start"}
					justifyContent={"space-between"}
				>
					<Box sx={{}}>
						<Typography
							variant="h6"
							fontWeight={"bold"}
							sx={{ fontSize: "0.7rem" }}
						>
							{t("terms_and_conditions")}
						</Typography>
						<List dense sx={{ p: 0, fontSize: "0.4rem" }}>
							<ListItem sx={{ p: 0, m: 0, fontSize: "0.4rem" }}>
								<ListItemText primary={`- ${t("term_1")}`} />
							</ListItem>
							<ListItem sx={{ p: 0, m: 0, fontSize: "0.4rem" }}>
								<ListItemText primary={`- ${t("term_2")}`} />
							</ListItem>
							<ListItem sx={{ p: 0, m: 0, fontSize: "0.4rem" }}>
								<ListItemText primary={`- ${t("term_3")}`} />
							</ListItem>
							<ListItem sx={{ p: 0, m: 0, fontSize: "0.4rem" }}>
								<ListItemText primary={`- ${t("term_4")}`} />
							</ListItem>
							<ListItem sx={{ p: 0, m: 0, fontSize: "0.4rem" }}>
								<ListItemText primary={`- ${t("term_5")}`} />
							</ListItem>
						</List>
					</Box>
					<Box sx={{ textAlign: "center" }}>
						<QRCode value={generateZatcaTlv()} size={100} />
					</Box>
				</Box>
				<Divider sx={{ my: 2 }} />
				<Box sx={{ fontSize: "0.8rem" }}>
					<Typography variant="h6" sx={{ fontSize: "1rem", mb: 1 }}>
						{t("payment_details")}
					</Typography>
					<Typography>
						{t("mode_of_payment")}: {invoice.mode_of_payment}
					</Typography>
					{invoice.mode_of_payment === "Online" && (
						<Typography>
							{t("transaction_id")}: {invoice.transaction_number}
						</Typography>
					)}
				</Box>
				<Typography variant="body2" align="center" flex={1} sx={{ mt: 3 }}>
					{t("thank_you_message")}
				</Typography>
			</Box>
			<Box sx={{ display: "flex", gap: 2, mt: 2 }}>
				<Button onClick={onClose} variant="outlined" fullWidth>
					{t("cancel")}
				</Button>
				<Button onClick={handlePrint} variant="contained" fullWidth>
					{t("print_invoice")}
				</Button>
			</Box>
		</Box>
	);
};

export default PrintableInvoice;
