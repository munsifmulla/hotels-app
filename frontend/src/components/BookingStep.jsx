import React, { useState, useEffect } from "react";
import {
	Box,
	Typography,
	Button,
	CircularProgress,
	TextField,
} from "@mui/material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useAuth } from "../context/AuthContext";

const BookingStep = ({ onBack, guest, room, hotelId }) => {
	const [checkIn, setCheckIn] = useState(null);
	const [checkOut, setCheckOut] = useState(null);
	const [totalPrice, setTotalPrice] = useState("");
	const [numberOfNights, setNumberOfNights] = useState(0);
	const [roomBookings, setRoomBookings] = useState([]);
	const [successMessage, setSuccessMessage] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const { createBooking, getBookingsForRoom } = useAuth();

	useEffect(() => {
		const fetchRoomBookings = async () => {
			if (room?.id) {
				try {
					const bookings = await getBookingsForRoom(room.id);
					setRoomBookings(bookings);
				} catch (err) {
					console.error("Error fetching room bookings:", err);
					setError("Could not fetch room availability.");
				}
			}
		};
		fetchRoomBookings();
	}, [room, getBookingsForRoom]);

	useEffect(() => {
		if (checkIn && checkOut && room.price_per_night) {
			const date1 = checkIn;
			const date2 = checkOut;

			if (date2 && date1 && date2 > date1) {
				const timeDiff = date2.getTime() - date1.getTime();
				const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
				setNumberOfNights(dayDiff);
				const calculatedPrice = dayDiff * room.price_per_night;
				setTotalPrice(calculatedPrice.toFixed(2));
			} else {
				setTotalPrice("");
				setNumberOfNights(0);
			}

			if (isDateRangeConflict(date1, date2)) {
				setError("Selected dates conflict with an existing booking.");
			} else {
				setError(""); // Clear previous errors
			}
		}
	}, [checkIn, checkOut, room.price_per_night, roomBookings]);

	const isDateRangeConflict = (start, end) => {
		if (!start || !end) return false;
		for (const existingBooking of roomBookings) {
			const existingStart = new Date(existingBooking.check_in_date);
			const existingEnd = new Date(existingBooking.check_out_date);
			// Overlap condition: (StartA < EndB) and (EndA > StartB)
			if (start < existingEnd && end > existingStart) {
				return true;
			}
		}
		return false;
	};

	const shouldDisableDate = (date) => {
		// Disable past dates
		if (date < new Date().setHours(0, 0, 0, 0)) return true;

		// Disable dates that are part of an existing booking
		return isDateRangeConflict(date, date);
	};

	const handleBooking = async () => {
		setLoading(true);
		setError("");
		try {
			const bookingData = {
				hotel_id: hotelId,
				guest_id: guest.id,
				room_id: room.id,
				check_in_date: checkIn,
				check_out_date: checkOut,
				total_price: totalPrice,
			};
			await createBooking(bookingData);
			setSuccessMessage("Booking confirmed successfully!");
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Box>
			<Typography variant="h6">Confirm Booking</Typography>
			{successMessage ? (
				<Box sx={{ my: 4, textAlign: "center" }}>
					<Typography variant="h5" color="success.main">
						{successMessage}
					</Typography>
					<Typography sx={{ mt: 1 }}>
						The room status has been updated. You can now close this window.
					</Typography>
				</Box>
			) : (
				<>
					<Typography>
						<b>Guest:</b> {guest.first_name} {guest.last_name}
					</Typography>
					<Typography>
						<b>Room:</b> {room.room_number}
					</Typography>

					<LocalizationProvider dateAdapter={AdapterDateFns}>
						<Box sx={{ display: "flex", gap: 2, mt: 2 }}>
							<DatePicker
								label="Check-in Date"
								value={checkIn}
								onChange={(newValue) => setCheckIn(newValue)}
								shouldDisableDate={shouldDisableDate}
								renderInput={(params) => <TextField {...params} fullWidth />}
								disablePast
							/>
							<DatePicker
								label="Check-out Date"
								value={checkOut}
								onChange={(newValue) => setCheckOut(newValue)}
								shouldDisableDate={shouldDisableDate}
								renderInput={(params) => <TextField {...params} fullWidth />}
								minDate={
									checkIn
										? new Date(checkIn.getTime() + 24 * 60 * 60 * 1000)
										: new Date()
								}
								disabled={!checkIn}
							/>
						</Box>
					</LocalizationProvider>
					{numberOfNights > 0 && (
						<Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
							Total Nights: {numberOfNights}
						</Typography>
					)}
					<TextField
						margin="normal"
						required
						fullWidth
						label="Total Price"
						type="number"
						value={totalPrice}
						InputProps={{
							readOnly: true,
						}}
					/>

					{error && <Typography color="error">{error}</Typography>}

					<Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
						<Button onClick={onBack}>Back</Button>
						<Button
							variant="contained"
							color="primary"
							onClick={handleBooking}
							disabled={loading || !!error}
						>
							{loading ? <CircularProgress size={24} /> : "Confirm & Book"}
						</Button>
					</Box>
				</>
			)}
		</Box>
	);
};

export default BookingStep;
