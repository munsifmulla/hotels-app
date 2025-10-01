import React, { useRef } from "react";
import {
	Box,
	Typography,
	Divider,
	Button,
	List,
	ListItem,
	ListItemText,
} from "@mui/material";
import { QRCodeSVG as QRCode } from "qrcode.react";
import { useReactToPrint } from "react-to-print";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";

const PrintableInvoice = React.forwardRef(
	({ invoice, booking, guest, onClose }) => {
		const { t } = useTranslation();
		const componentRef = useRef();
		const { tokenPayload } = useAuth();
		const handlePrint = useReactToPrint({
			contentRef: componentRef,
		});
		if (!invoice || !booking || !guest) return null;

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
				<Box ref={componentRef} sx={{ p: 4, border: "1px solid #ccc", my: 2 }}>
					<Typography variant="h6" align="center" gutterBottom>
						{t("invoice")}
					</Typography>
					<Typography
						variant="h4"
						align="center"
						color="primary"
						sx={{ mb: 1 }}
					>
						{tokenPayload?.data?.business_name}
					</Typography>
					<Divider sx={{ my: 2 }} />
					<Box sx={{ display: "flex", justifyContent: "space-between" }}>
						<Typography>
							<b>{t("invoice_id")}</b> {invoice.id}
						</Typography>
						<Typography>
							<b>{t("date")}</b>{" "}
							{new Date(invoice.invoice_date).toLocaleDateString()}
						</Typography>
					</Box>
					<Box sx={{ mt: 2 }}>
						<Typography>
							<b>{t("booking_id")}</b> {booking.id}
						</Typography>
						<Typography>
							<b>{t("guest_name")}</b> {guest.first_name} {guest.last_name}
						</Typography>
						{guest.govt_id && (
							<Typography>
								<b>{t("government_id")}</b> {guest.govt_id}
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
					<Box sx={{ display: "flex", justifyContent: "space-between" }}>
						<Typography>{t("total_amount")}</Typography>
						<Typography>
							{t("currency")} {invoice.total_amount}
						</Typography>
					</Box>
					<Box sx={{ display: "flex", justifyContent: "space-between" }}>
						<Typography>{t("discount")}</Typography>
						<Typography color="error">
							- {t("currency")} {invoice.discount}
						</Typography>
					</Box>
					<Divider sx={{ my: 1 }} />
					<Box sx={{ display: "flex", justifyContent: "space-between" }}>
						<Typography>{t("subtotal")}</Typography>
						<Typography>
							{t("currency")} {invoice.final_amount}
						</Typography>
					</Box>
					<Box sx={{ display: "flex", justifyContent: "space-between" }}>
						<Typography>
							{t("vat_percent_label", { percent: invoice.vat_percent })}
						</Typography>
						<Typography>
							{t("currency")} {invoice.vat_amount}
						</Typography>
					</Box>
					<Divider sx={{ my: 1 }} />
					<Box sx={{ display: "flex", justifyContent: "space-between" }}>
						<Typography variant="h6">{t("grand_total")}</Typography>
						<Typography variant="h6">
							{t("currency")}{" "}
							{(
								parseFloat(invoice.final_amount) +
								parseFloat(invoice.vat_amount)
							).toFixed(2)}
						</Typography>
					</Box>
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
	}
);

export default PrintableInvoice;
