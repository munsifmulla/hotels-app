import React, { useState, useEffect } from "react";
import {
	Box,
	Typography,
	Button,
	TextField,
	CircularProgress,
} from "@mui/material";
import { useAuth } from "../context/AuthContext";

const BookingStep = ({ onBack, guest, room, hotelId }) => {
	const [checkIn, setCheckIn] = useState("");
	const [checkOut, setCheckOut] = useState("");
	const [totalPrice, setTotalPrice] = useState("");
	const [numberOfNights, setNumberOfNights] = useState(0);
	const [successMessage, setSuccessMessage] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const { createBooking } = useAuth();

	const today = new Date().toISOString().split("T")[0];

	const getMinCheckOutDate = () => {
		if (!checkIn) return "";
		const checkInDate = new Date(checkIn);
		// Set to next day in a timezone-safe way
		checkInDate.setUTCDate(checkInDate.getUTCDate() + 1);
		return checkInDate.toISOString().split("T")[0];
	};

	useEffect(() => {
		if (checkIn && checkOut && room.price_per_night) {
			const date1 = new Date(checkIn);
			const date2 = new Date(checkOut);

			if (date2 > date1) {
				const timeDiff = date2.getTime() - date1.getTime();
				const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
				setNumberOfNights(dayDiff);
				const calculatedPrice = dayDiff * room.price_per_night;
				setTotalPrice(calculatedPrice.toFixed(2));
			} else {
				setTotalPrice("");
				setNumberOfNights(0);
			}
		}
	}, [checkIn, checkOut, room.price_per_night]);

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

					<TextField
						margin="normal"
						required
						fullWidth
						label="Check-in Date"
						type="date"
						value={checkIn}
						onChange={(e) => setCheckIn(e.target.value)}
						InputLabelProps={{ shrink: true }}
						inputProps={{
							min: today,
						}}
					/>
					<TextField
						margin="normal"
						required
						fullWidth
						label="Check-out Date"
						type="date"
						value={checkOut}
						onChange={(e) => setCheckOut(e.target.value)}
						InputLabelProps={{ shrink: true }}
						inputProps={{
							min: getMinCheckOutDate(),
						}}
						disabled={!checkIn}
					/>
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
							disabled={loading}
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
