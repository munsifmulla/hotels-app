import React from "react";
import { Box, Typography, Divider } from "@mui/material";
import { QRCodeSVG as QRCode } from "qrcode.react";

const PrintableInvoice = React.forwardRef(
	({ invoice, booking, guest }, ref) => {
		if (!invoice || !booking || !guest) return null;

		// Helper function to generate TLV (Tag-Length-Value) for ZATCA e-invoicing QR code
		const generateZatcaTlv = () => {
			const sellerName = "Hotel Name"; // Tag 1
			const vatNumber = "123456789"; // Tag 2
			const timestamp = new Date(invoice.invoice_date).toISOString(); // Tag 3
			const invoiceTotal = (
				parseFloat(invoice.final_amount) + parseFloat(invoice.vat_amount)
			).toFixed(2); // Tag 4
			const vatTotal = invoice.vat_amount; // Tag 5

			const tags = [
				{ tag: 1, value: sellerName },
				{ tag: 2, value: vatNumber },
				{ tag: 3, value: timestamp },
				{ tag: 4, value: invoiceTotal },
				{ tag: 5, value: vatTotal },
			];

			const textEncoder = new TextEncoder();

			const toHex = (byteArray) =>
				Array.from(byteArray)
					.map((b) => b.toString(16).padStart(2, "0"))
					.join("");

			const tlvStrings = tags.map((tag) => {
				const tagHex = tag.tag.toString(16).padStart(2, "0");
				const valueBytes = textEncoder.encode(tag.value);
				const lengthHex = valueBytes.length.toString(16).padStart(2, "0");
				return tagHex + lengthHex + toHex(valueBytes);
			});

			const tlvHex = tlvStrings.join("");

			// Convert hex string to Uint8Array
			const hexToBytes = (hex) => {
				const bytes = [];
				for (let c = 0; c < hex.length; c += 2) {
					bytes.push(parseInt(hex.substr(c, 2), 16));
				}
				return new Uint8Array(bytes);
			};

			const tlvBytes = hexToBytes(tlvHex);

			// Convert Uint8Array to base64
			const base64 = btoa(String.fromCharCode.apply(null, tlvBytes));

			return base64;
		};

		return (
			<Box ref={ref} sx={{ p: 4, border: "1px solid #ccc", my: 2 }}>
				<Typography variant="h4" gutterBottom>
					Invoice
				</Typography>
				<Typography variant="h6">Hotel Name</Typography>
				<Divider sx={{ my: 2 }} />
				<Box sx={{ display: "flex", justifyContent: "space-between" }}>
					<Typography>
						<b>Invoice ID:</b> {invoice.id}
					</Typography>
					<Typography>
						<b>Date:</b> {new Date(invoice.invoice_date).toLocaleDateString()}
					</Typography>
				</Box>
				<Box sx={{ mt: 2 }}>
					<Typography>
						<b>Booking ID:</b> {booking.id}
					</Typography>
					<Typography>
						<b>Guest Name:</b> {guest.first_name} {guest.last_name}
					</Typography>
					{guest.govt_id && (
						<Typography>
							<b>Government ID:</b> {guest.govt_id}
						</Typography>
					)}
				</Box>
				<Box sx={{ mt: 2, display: "flex", justifyContent: "space-between" }}>
					<Typography>
						<b>Check-in:</b>{" "}
						{new Date(booking.check_in_date).toLocaleDateString()}
					</Typography>
					<Typography>
						<b>Check-out:</b>{" "}
						{new Date(booking.check_out_date).toLocaleDateString()}
					</Typography>
				</Box>
				<Divider sx={{ my: 2 }} />
				<Box sx={{ display: "flex", justifyContent: "space-between" }}>
					<Typography>Total Amount:</Typography>
					<Typography>{invoice.total_amount}</Typography>
				</Box>
				<Box sx={{ display: "flex", justifyContent: "space-between" }}>
					<Typography>Discount:</Typography>
					<Typography color="error">- {invoice.discount}</Typography>
				</Box>
				<Divider sx={{ my: 1 }} />
				<Box sx={{ display: "flex", justifyContent: "space-between" }}>
					<Typography>Subtotal:</Typography>
					<Typography>{invoice.final_amount}</Typography>
				</Box>
				<Box sx={{ display: "flex", justifyContent: "space-between" }}>
					<Typography>VAT ({invoice.vat_percent}%):</Typography>
					<Typography>{invoice.vat_amount}</Typography>
				</Box>
				<Divider sx={{ my: 1 }} />
				<Box sx={{ display: "flex", justifyContent: "space-between" }}>
					<Typography variant="h6">Grand Total:</Typography>
					<Typography variant="h6">
						{(
							parseFloat(invoice.final_amount) + parseFloat(invoice.vat_amount)
						).toFixed(2)}
					</Typography>
				</Box>
				<Box sx={{ mt: 4, textAlign: "center" }}>
					<QRCode value={generateZatcaTlv()} />
				</Box>
			</Box>
		);
	}
);

export default PrintableInvoice;
