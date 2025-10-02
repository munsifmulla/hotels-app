import React, { useState, useEffect, useCallback } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useParams } from "react-router-dom";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import enUS from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";

const locales = {
	"en-US": enUS,
};

const localizer = dateFnsLocalizer({
	format,
	parse,
	startOfWeek,
	getDay,
	locales,
});

const HotelDashboardPage = () => {
	const { hotelId } = useParams();
	const { getBookings, getGuests, getRooms } = useAuth();
	const { t } = useTranslation();
	const [events, setEvents] = useState([]);
	const [date, setDate] = useState(new Date());
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	const messages = {
		today: t("today"),
		previous: t("previous"),
		next: t("next"),
	};

	const fetchData = useCallback(async () => {
		try {
			setLoading(true);
			setError("");
			const [bookingsData, guestsData, roomsData] = await Promise.all([
				getBookings(hotelId),
				getGuests(hotelId),
				getRooms(hotelId),
			]);

			const guestMap = new Map(guestsData.map((g) => [g.id, g]));
			const roomMap = new Map(roomsData.map((r) => [r.id, r]));

			const calendarEvents = bookingsData
				.filter((booking) => booking.status === "confirmed")
				.map((booking) => {
					const guest = guestMap.get(booking.guest_id);
					const room = roomMap.get(booking.room_id);
					const title = `${t("room_prefix")} ${room?.room_number || "?"} - ${
						guest?.first_name || t("guest")
					}`;

					// Adjust end date to be inclusive for display
					const endDate = new Date(booking.check_out_date);

					return {
						title,
						start: new Date(booking.check_in_date),
						end: endDate,
						allDay: true,
						resource: booking, // Keep original booking data
					};
				});

			setEvents(calendarEvents);
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	}, [getBookings, getGuests, getRooms, hotelId]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	if (loading) {
		return (
			<Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
				<CircularProgress />
			</Box>
		);
	}

	if (error) {
		return <Typography color="error">Error: {error}</Typography>;
	}

	return (
		<Box sx={{ height: "80vh" }}>
			<Calendar
				localizer={localizer}
				events={events}
				startAccessor="start"
				endAccessor="end"
				views={["month"]}
				date={date}
				onNavigate={(newDate) => setDate(newDate)}
				messages={messages}
				style={{ height: "100%" }}
			/>
		</Box>
	);
};

export default HotelDashboardPage;
