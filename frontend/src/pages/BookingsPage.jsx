import React, { useState, useEffect, useCallback } from "react";
import {
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Paper,
	Typography,
	CircularProgress,
	Box,
	Chip,
	Button,
} from "@mui/material";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import InvoiceModal from "../components/InvoiceModal";

const BookingsPage = () => {
	const [bookings, setBookings] = useState([]);
	const [guests, setGuests] = useState([]);
	const [rooms, setRooms] = useState([]);
	const [selectedBooking, setSelectedBooking] = useState(null);
	const [existingInvoice, setExistingInvoice] = useState(null);
	const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const {
		getBookings,
		getGuests,
		getRooms,
		updateBooking,
		getInvoiceByBookingId,
	} = useAuth();
	const { hotelId } = useParams();
	const { t } = useTranslation();

	const fetchData = useCallback(async () => {
		try {
			setLoading(true);
			setError("");
			const [bookingsData, guestsData, roomsData] = await Promise.all([
				getBookings(hotelId),
				getGuests(hotelId),
				getRooms(hotelId),
			]);
			setBookings(bookingsData);
			setGuests(guestsData);
			setRooms(roomsData);
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	}, [getBookings, getGuests, getRooms, hotelId]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const getGuestName = (guestId) => {
		const guest = guests.find((g) => g.id === guestId);
		return guest ? `${guest.first_name} ${guest.last_name}` : "Unknown";
	};

	const getRoomNumber = (roomId) => {
		const room = rooms.find((r) => r.id === roomId);
		return room ? room.room_number : "Unknown";
	};

	const handleCheckout = async (booking) => {
		try {
			// First, update the booking status
			await updateBooking(booking.id, { status: "checked-out" });
			// Then, open the invoice modal
			setSelectedBooking(booking);
			setExistingInvoice(null); // Ensure we are in generation mode
			setIsInvoiceModalOpen(true);
			// Refresh data in the background
			fetchData();
		} catch (err) {
			// You might want to show a snackbar error here
			console.error("Checkout failed:", err);
		}
	};

	const handleViewInvoice = async (booking) => {
		try {
			// Check if an invoice already exists
			const invoice = await getInvoiceByBookingId(booking.id);
			setSelectedBooking(booking);
			setExistingInvoice(invoice); // This will be null if no invoice is found
			setIsInvoiceModalOpen(true);
		} catch (err) {
			console.error("Failed to fetch invoice:", err);
			setError("Could not retrieve invoice information.");
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
			<Typography variant="h4" gutterBottom>
				{t("bookings")}
			</Typography>
			{bookings.length > 0 ? (
				<TableContainer component={Paper}>
					<Table>
						<TableHead>
							<TableRow>
								<TableCell>{t("guest")}</TableCell>
								<TableCell>{t("room")}</TableCell>
								<TableCell>{t("check_in")}</TableCell>
								<TableCell>{t("check_out")}</TableCell>
								<TableCell align="right">{t("price")}</TableCell>
								<TableCell>{t("status")}</TableCell>
								<TableCell align="right">{t("actions")}</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{bookings.map((booking) => (
								<TableRow key={booking.id}>
									<TableCell>{getGuestName(booking.guest_id)}</TableCell>
									<TableCell>{getRoomNumber(booking.room_id)}</TableCell>
									<TableCell>
										{new Date(booking.check_in_date).toLocaleDateString()}
									</TableCell>
									<TableCell>
										{new Date(booking.check_out_date).toLocaleDateString()}
									</TableCell>
									<TableCell align="right">
										{t("currency")} {booking.total_price}
									</TableCell>
									<TableCell>
										<Chip label={booking.status} size="small" />
									</TableCell>
									<TableCell align="right">
										{booking.status === "checked-out" ? (
											<Button
												variant="outlined"
												size="small"
												onClick={() => handleViewInvoice(booking)}
											>
												View Invoice
											</Button>
										) : (
											<Button
												variant="outlined"
												size="small"
												onClick={() => handleCheckout(booking)}
											>
												Checkout
											</Button>
										)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</TableContainer>
			) : (
				<Typography sx={{ mt: 4, textAlign: "center" }}>
					{t("no_bookings_found")}
				</Typography>
			)}

			{selectedBooking && (
				<InvoiceModal
					open={isInvoiceModalOpen}
					onClose={() => setIsInvoiceModalOpen(false)}
					booking={selectedBooking}
					existingInvoice={existingInvoice}
				/>
			)}
		</Box>
	);
};

export default BookingsPage;
