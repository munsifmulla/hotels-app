import React, { useState, useEffect } from "react";
import { Grid, Typography, CircularProgress, Box } from "@mui/material";
import { useAuth } from "../context/AuthContext";
import HotelCard from "./HotelCard";

const HotelList = () => {
	const [hotels, setHotels] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const { getHotels } = useAuth();

	useEffect(() => {
		const fetchHotels = async () => {
			try {
				setLoading(true);
				setError("");
				const data = await getHotels();
				// Sort hotels to show "not subscribed" ones last
				const sortedData = data.sort((a, b) => {
					const aIsUnsubscribed = a.status === "not subscribed";
					const bIsUnsubscribed = b.status === "not subscribed";
					return aIsUnsubscribed - bIsUnsubscribed;
				});
				setHotels(sortedData);
			} catch (err) {
				setError(err.message);
			} finally {
				setLoading(false);
			}
		};

		fetchHotels();
	}, [getHotels]);

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
		<Grid container spacing={3}>
			{hotels.map((hotel, index) => (
				<Grid item key={hotel.id || index}>
					<HotelCard hotel={hotel} />
				</Grid>
			))}
		</Grid>
	);
};

export default HotelList;
