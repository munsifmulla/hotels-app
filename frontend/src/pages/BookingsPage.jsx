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
	Modal,
	TextField,
	TablePagination,
} from "@mui/material";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import InvoiceModal from "../components/InvoiceModal";
import ServicesManagementModal from "../components/ServicesManagementModal";

const BookingsPage = () => {
	const [bookings, setBookings] = useState([]);
	const [guests, setGuests] = useState([]);
	const [rooms, setRooms] = useState([]);
	const [services, setServices] = useState([]);
	const [serviceTypes, setServiceTypes] = useState([]);
	const [selectedBooking, setSelectedBooking] = useState(null);
	const [existingInvoice, setExistingInvoice] = useState(null);
	const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
	const [isServicesModalOpen, setIsServicesModalOpen] = useState(false);
	const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);
	const [filter, setFilter] = useState("");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const {
		getBookings,
		getGuests,
		getRooms,
		updateBooking,
		getInvoiceByBookingId,
		getServices,
		getServiceTypes,
	} = useAuth();
	const { hotelId } = useParams();
	const { t } = useTranslation();

	const fetchData = useCallback(async () => {
		try {
			setLoading(true);
			setError("");
			const [
				bookingsData,
				guestsData,
				roomsData,
				servicesData,
				serviceTypesData,
			] = await Promise.all([
				getBookings(hotelId),
				getGuests(hotelId),
				getRooms(hotelId),
				getServices(hotelId),
				getServiceTypes(hotelId),
			]);

			const statusOrder = {
				confirmed: 1,
				"checked-in": 2, // Assuming checked-in comes after confirmed
				"checked-out": 3,
				cancelled: 4,
			};

			const sortedBookings = bookingsData.sort(
				(a, b) => (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99)
			);

			setBookings(sortedBookings);
			setGuests(guestsData);
			setRooms(roomsData);
			setServices(servicesData);
			setServiceTypes(serviceTypesData);
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	}, [getBookings, getGuests, getRooms, getServices, getServiceTypes, hotelId]);

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

	const getServicesTotalForBooking = (bookingId) => {
		const bookingServices = services.filter((s) => s.booking_id === bookingId);
		const serviceTypeMap = new Map(serviceTypes.map((st) => [st.id, st]));

		return bookingServices.reduce((total, service) => {
			const serviceType = serviceTypeMap.get(service.service_id);
			const price = serviceType ? parseFloat(serviceType.price) : 0;
			return total + price;
		}, 0);
	};

	const handleCheckout = (booking) => {
		// Just open the modal without updating the status first
		setSelectedBooking(booking);
		setExistingInvoice(null); // Ensure we are in generation mode
		setIsInvoiceModalOpen(true);
	};

	const handleViewInvoice = async (booking) => {
		try {
			// Check if an invoice already exists
			const invoice = await getInvoiceByBookingId(booking.id);
			setSelectedBooking(booking);
			setExistingInvoice(invoice); // This will be null if no invoice is found
			setIsInvoiceModalOpen(true);
		} catch (err) {
			console.error("Error fetching invoice:", err);
			setError("Could not retrieve invoice information.");
		}
	};

	const handleOpenServicesModal = (booking) => {
		setSelectedBooking(booking);
		setIsServicesModalOpen(true);
	};

	const handleOpenCancelModal = (booking) => {
		setSelectedBooking(booking);
		setIsCancelModalOpen(true);
	};

	const handleCancelBooking = async () => {
		if (!selectedBooking) return;
		try {
			await updateBooking(selectedBooking.id, { status: "cancelled" });
			setIsCancelModalOpen(false);
			setSelectedBooking(null);
			fetchData(); // Refresh the list
		} catch (err) {
			// You might want to show a snackbar error here
			console.error("Cancellation failed:", err);
		}
	};

	const handleChangePage = (event, newPage) => {
		setPage(newPage);
	};

	const handleChangeRowsPerPage = (event) => {
		setRowsPerPage(parseInt(event.target.value, 10));
		setPage(0);
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

	const filteredBookings = bookings.filter((booking) => {
		if (!filter) return true;
		const lowercasedFilter = filter.toLowerCase();
		const guest = guests.find((g) => g.id === booking.guest_id);
		const room = rooms.find((r) => r.id === booking.room_id);

		return (
			booking.id.toString().includes(lowercasedFilter) ||
			(room && room.room_number.toLowerCase().includes(lowercasedFilter)) ||
			(guest &&
				`${guest.first_name} ${guest.last_name}`
					.toLowerCase()
					.includes(lowercasedFilter)) ||
			new Date(booking.check_in_date)
				.toLocaleDateString()
				.includes(lowercasedFilter) ||
			new Date(booking.check_out_date)
				.toLocaleDateString()
				.includes(lowercasedFilter)
		);
	});

	return (
		<Box>
			<Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
				<Typography variant="h4" gutterBottom>
					{t("bookings")}
				</Typography>
				<TextField
					label={t("search")}
					variant="outlined"
					size="small"
					value={filter}
					onChange={(e) => setFilter(e.target.value)}
				/>
			</Box>
			{filteredBookings.length > 0 ? (
				<TableContainer component={Paper}>
					<Table>
						<TableHead>
							<TableRow>
								<TableCell>{t("guest")}</TableCell>
								<TableCell>{t("room")}</TableCell>
								<TableCell>{t("check_in")}</TableCell>
								<TableCell>{t("check_out")}</TableCell>
								<TableCell align="right">{t("price")}</TableCell>
								<TableCell align="right">{t("services")}</TableCell>
								<TableCell>{t("status")}</TableCell>
								<TableCell align="right">{t("actions")}</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{filteredBookings
								.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
								.map((booking) => (
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
										<TableCell align="right">
											{t("currency")}{" "}
											{getServicesTotalForBooking(booking.id).toFixed(2)}
										</TableCell>
										<TableCell>
											<Chip label={booking.status} size="small" />
										</TableCell>
										<TableCell align="right">
											{booking.status === "confirmed" && (
												<>
													<Button
														variant="outlined"
														size="small"
														onClick={() => handleOpenServicesModal(booking)}
														sx={{ mr: 1 }}
													>
														{t("manage_services")}
													</Button>
													<Button
														variant="outlined"
														size="small"
														onClick={() => handleCheckout(booking)}
														sx={{ mr: 1 }}
													>
														{t("checkout_button")}
													</Button>
													<Button
														variant="outlined"
														color="error"
														size="small"
														onClick={() => handleOpenCancelModal(booking)}
													>
														{t("cancel_booking")}
													</Button>
												</>
											)}
											{booking.status === "checked-out" && (
												<Button
													variant="outlined"
													size="small"
													onClick={() => handleViewInvoice(booking)}
												>
													{t("view_invoice")}
												</Button>
											)}
										</TableCell>
									</TableRow>
								))}
						</TableBody>
					</Table>
					<TablePagination
						rowsPerPageOptions={[5, 10, 25]}
						component="div"
						count={filteredBookings.length}
						rowsPerPage={rowsPerPage}
						page={page}
						onPageChange={handleChangePage}
						onRowsPerPageChange={handleChangeRowsPerPage}
					/>
				</TableContainer>
			) : (
				<Typography sx={{ mt: 4, textAlign: "center" }}>
					{t("no_bookings_found")}
				</Typography>
			)}

			{selectedBooking && rooms.length > 0 && (
				<InvoiceModal
					open={isInvoiceModalOpen}
					onClose={() => {
						setIsInvoiceModalOpen(false);
						fetchData(); // Refresh data when modal closes
					}}
					booking={selectedBooking}
					room={rooms.find((r) => r.id === selectedBooking.room_id)}
					existingInvoice={existingInvoice}
				/>
			)}

			{selectedBooking && (
				<ServicesManagementModal
					open={isServicesModalOpen}
					onClose={() => {
						setIsServicesModalOpen(false);
						fetchData(); // Refresh data to show updated service totals
					}}
					booking={selectedBooking}
					hotelId={hotelId}
				/>
			)}
			<Modal
				open={isCancelModalOpen}
				onClose={() => setIsCancelModalOpen(false)}
			>
				<Box
					sx={{
						position: "absolute",
						top: "50%",
						left: "50%",
						transform: "translate(-50%, -50%)",
						width: 400,
						bgcolor: "background.paper",
						boxShadow: 24,
						p: 4,
						borderRadius: 2,
					}}
				>
					<Typography variant="h6" component="h2">
						{t("confirm_cancellation")}
					</Typography>
					<Typography sx={{ mt: 2 }}>
						{t("cancel_confirmation_message")}
					</Typography>
					<Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
						<Button onClick={() => setIsCancelModalOpen(false)} sx={{ mr: 1 }}>
							{t("cancel")}
						</Button>
						<Button
							onClick={handleCancelBooking}
							variant="contained"
							color="error"
						>
							{t("cancel_booking")}
						</Button>
					</Box>
				</Box>
			</Modal>
		</Box>
	);
};

export default BookingsPage;
