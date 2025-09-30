import React from "react";
import { Typography, Paper } from "@mui/material";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

const HotelDashboardPage = () => {
	const { hotelId } = useParams();
	const { t } = useTranslation();

	return (
		<Paper sx={{ p: 4 }}>
			<Typography variant="h4" gutterBottom>
				{t("hotel_dashboard_for_id", { hotelId })}
			</Typography>
			<Typography variant="body1">
				{t("hotel_dashboard_manage_text")}
			</Typography>
		</Paper>
	);
};

export default HotelDashboardPage;
