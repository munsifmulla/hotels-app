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
import i18n from "../i18n";

const PrintableInvoice = ({
	invoice,
	booking,
	guest,
	room,
	services,
	onClose,
}) => {
	const { t } = useTranslation();
	const componentRef = useRef();
	const { tokenPayload } = useAuth();
	const handlePrint = useReactToPrint({
		contentRef: componentRef,
		pageStyle: `@page { size: auto; margin: 10mm; }`,
	});
	if (!invoice || !booking || !guest || !room || !services) return null;

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

	const stayDuration = Math.ceil(
		(new Date(booking.check_out_date) - new Date(booking.check_in_date)) /
			(1000 * 60 * 60 * 24)
	);

	return (
		<Box>
			<Box ref={componentRef} dir={i18n.language === "ar" ? "rtl" : "ltr"}>
				<Typography
					variant="h6"
					align="center"
					gutterBottom
					sx={{ fontSize: "1.2rem", fontWeight: "bold" }}
				>
					{t("invoice")}
				</Typography>
				<Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
					<Box>
						<Typography
							variant="h6"
							color="primary"
							sx={{ fontWeight: "bold", fontSize: "1rem" }}
						>
							{tokenPayload?.data?.business_name}
						</Typography>
						<Typography sx={{ fontSize: "0.65rem" }}>
							{tokenPayload?.data?.address}
						</Typography>
						<Typography sx={{ fontSize: "0.65rem" }}>
							{tokenPayload?.data?.phone_number}
						</Typography>
						<Typography sx={{ fontSize: "0.65rem" }}>
							{tokenPayload?.data?.email}
						</Typography>
						<Typography sx={{ fontSize: "0.65rem" }}>
							TRN: {tokenPayload?.data?.trn_number}
						</Typography>
					</Box>
					<Box sx={{ textAlign: "right" }}>
						<Typography sx={{ fontSize: "0.8rem" }}>
							<b>{t("invoice_number")}</b> {invoice.invoice_number}
						</Typography>
						<Typography sx={{ fontSize: "0.8rem" }}>
							<b>{t("invoice_date")}</b>{" "}
							{new Date(invoice.invoice_date).toLocaleDateString()}
						</Typography>
						<Typography sx={{ fontSize: "0.8rem" }}>
							<b>{t("mode_of_payment")}:</b> {invoice.mode_of_payment}
						</Typography>
						{invoice.mode_of_payment === "Online" && (
							<Typography sx={{ fontSize: "0.8rem" }}>
								<b>{t("transaction_id")}:</b> {invoice.transaction_number}
							</Typography>
						)}
					</Box>
				</Box>

				<Divider sx={{ my: 2 }} />

				<Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
					<Box>
						<Typography sx={{ fontWeight: "bold", fontSize: "0.9rem" }}>
							{t("bill_to")}:
						</Typography>
						<Typography sx={{ fontSize: "0.8rem" }}>
							<b>{t("guest_name")}</b> {guest.first_name} {guest.last_name}
						</Typography>
						<Typography sx={{ fontSize: "0.8rem" }}>{guest.email}</Typography>
						{guest.govt_id && (
							<Typography sx={{ fontSize: "0.8rem" }}>
								{t("guest_id")} {guest.govt_id}
							</Typography>
						)}
					</Box>
					<Box sx={{ textAlign: "right" }}>
						<Typography sx={{ fontWeight: "bold", fontSize: "0.9rem" }}>
							{t("stay_details")}
						</Typography>
						<Typography sx={{ fontSize: "0.8rem" }}>
							<b>{t("check_in_date")}</b>{" "}
							{new Date(booking.check_in_date).toLocaleDateString()}
						</Typography>
						<Typography sx={{ fontSize: "0.8rem" }}>
							<b>{t("check_out_date")}</b>{" "}
							{new Date(booking.check_out_date).toLocaleDateString()}
						</Typography>
						<Typography sx={{ fontSize: "0.8rem" }}>
							<b>{t("stay_duration", { count: stayDuration })}</b>
						</Typography>
					</Box>
				</Box>

				<Divider sx={{ my: 2 }} />

				<Typography sx={{ fontWeight: "bold", fontSize: "0.9rem" }}>
					{t("invoice_details")}:
				</Typography>
				<TableContainer>
					<Table size="small">
						<TableHead>
							<TableRow sx={{ "& th": { borderBottom: "1px solid black" } }}>
								<TableCell
									sx={{
										fontWeight: "bold",
										fontSize: "0.8rem",
										width: "60%",
										textAlign: i18n.language === "ar" ? "center" : "left",
									}}
								>
									{t("description_of_services")}
								</TableCell>
								<TableCell></TableCell>
								<TableCell
									align="right"
									sx={{ fontWeight: "bold", fontSize: "0.8rem" }}
								>
									{t("amount")}
								</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							<TableRow>
								<TableCell
									sx={{
										fontSize: "0.8rem",
										textAlign: i18n.language === "ar" ? "right" : "left",
									}}
								>
									{t("room_charges")} ({t("room_prefix")} {room.room_number})
								</TableCell>
								<TableCell></TableCell>
								<TableCell align="right" sx={{ fontSize: "0.8rem" }}>
									{booking.total_price}
								</TableCell>
							</TableRow>
							{services.map((service) => (
								<TableRow key={service.id}>
									<TableCell
										sx={{
											fontSize: "0.8rem",
											textAlign: i18n.language === "ar" ? "right" : "left",
										}}
									>
										{service.name}
									</TableCell>
									<TableCell></TableCell>
									<TableCell align="right" sx={{ fontSize: "0.8rem" }}>
										{service.price}
									</TableCell>
								</TableRow>
							))}
							{/* Summary Section */}
							<TableRow sx={{ "& td": { border: 0 } }}>
								<TableCell rowSpan={6} />
								<TableCell
									colSpan={1}
									sx={{ borderTop: "1px solid black", fontSize: "0.8rem" }}
									align="right"
								>
									{t("total_amount")}
								</TableCell>
								<TableCell
									align="right"
									sx={{ borderTop: "1px solid black", fontSize: "0.8rem" }}
								>
									{invoice.total_amount}
								</TableCell>
							</TableRow>
							<TableRow sx={{ "& td": { border: 0 } }}>
								<TableCell
									colSpan={1}
									align="right"
									sx={{ fontSize: "0.8rem" }}
								>
									{t("advance_amount")}
								</TableCell>
								<TableCell
									align="right"
									sx={{ color: "success.main", fontSize: "0.8rem" }}
								>
									- {booking.advance_amount}
								</TableCell>
							</TableRow>
							<TableRow sx={{ "& td": { border: 0 } }}>
								<TableCell
									colSpan={1}
									align="right"
									sx={{ fontSize: "0.8rem" }}
								>
									{t("discount")}
								</TableCell>
								<TableCell
									align="right"
									sx={{ color: "error.main", fontSize: "0.8rem" }}
								>
									- {invoice.discount}
								</TableCell>
							</TableRow>
							<TableRow sx={{ "& td": { border: 0 } }}>
								<TableCell
									colSpan={1}
									align="right"
									sx={{ fontSize: "0.8rem" }}
								>
									{t("subtotal")}
								</TableCell>
								<TableCell align="right" sx={{ fontSize: "0.8rem" }}>
									{invoice.final_amount}
								</TableCell>
							</TableRow>
							<TableRow sx={{ "& td": { border: 0 } }}>
								<TableCell
									colSpan={1}
									align="right"
									sx={{ fontSize: "0.8rem" }}
								>
									{t("vat_percent_label", {
										percent: parseInt(invoice.vat_percent, 10),
									})}
								</TableCell>
								<TableCell align="right" sx={{ fontSize: "0.8rem" }}>
									{invoice.vat_amount}
								</TableCell>
							</TableRow>
							<TableRow sx={{ "& td": { border: 0 } }}>
								<TableCell
									colSpan={1}
									align="right"
									sx={{ fontWeight: "bold", fontSize: "1rem" }}
								>
									{t("balance_due")}
								</TableCell>
								<TableCell
									align="right"
									sx={{ fontWeight: "bold", fontSize: "1rem" }}
								>
									{t("currency")}{" "}
									{(
										parseFloat(invoice.final_amount) +
										parseFloat(invoice.vat_amount) -
										parseFloat(booking.advance_amount)
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
							{[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
								<ListItem
									key={i}
									sx={{
										p: 0,
										m: 0,
										fontSize: "0.4rem",
										textAlign: i18n.language === "ar" ? "right" : "left",
									}}
								>
									<ListItemText
										primary={`- ${t(`term_${i}`)}`}
										primaryTypographyProps={{
											sx: {
												fontSize: "0.6rem",
											},
										}}
									/>
								</ListItem>
							))}
						</List>
					</Box>
					<Box sx={{ textAlign: "center" }}>
						<QRCode value={generateZatcaTlv()} size={100} />
					</Box>
				</Box>
				<Divider sx={{ my: 2 }} />
				<Typography variant="body2" align="center" flex={1} sx={{ mt: 3 }}>
					{t("thank_you_message")}
				</Typography>
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						mt: 8,
						pt: 4,
					}}
				>
					<Box sx={{ width: "40%", textAlign: "center" }}>
						<Divider />
						<Typography sx={{ fontSize: "0.8rem", mt: 1 }}>
							{t("guest_signature")}
						</Typography>
					</Box>
					<Box sx={{ width: "40%", textAlign: "center" }}>
						<Divider />
						<Typography sx={{ fontSize: "0.8rem", mt: 1 }}>
							{t("authorised_signature")}
						</Typography>
					</Box>
				</Box>
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
