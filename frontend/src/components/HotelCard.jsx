import React from "react";
import {
	Card,
	CardContent,
	CardMedia,
	CardActionArea,
	Typography,
	Box,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

const HotelCard = ({ hotel }) => {
	const { t } = useTranslation();
	const isSubscribed = hotel.status === "subscribed";

	return (
		<Box
			sx={{ position: "relative", textDecoration: "none" }}
			component={isSubscribed ? Link : "div"}
			to={`/hotel/${hotel.id}`}
		>
			{!isSubscribed && (
				<Box
					sx={{
						position: "absolute",
						width: "100%",
						top: "18px",
						backgroundColor: "secondary.main",
						color: "white",
						fontSize: "0.7rem",
						fontWeight: "bold",
						zIndex: 2,
						textAlign: "center",
						boxShadow: 1,
					}}
				>
					{t("not_subscribed")}
				</Box>
			)}
			<CardActionArea
				disabled={!isSubscribed}
				sx={{
					width: 200,
					transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
					"&:hover": {
						transform: isSubscribed ? "scale(1.01)" : "none",
						boxShadow: isSubscribed ? 8 : 1,
					},
				}}
			>
				<Card
					sx={{
						width: 200,
						opacity: isSubscribed ? 1 : 0.6,
						pointerEvents: isSubscribed ? "auto" : "none",
					}}
				>
					<CardMedia
						component="img"
						height="140"
						image="https://images.unsplash.com/photo-1566073771259-6a8506099945"
						alt={hotel.name}
					/>
					<CardContent sx={{ textAlign: "center" }}>
						<Typography gutterBottom variant="h6" component="div" noWrap>
							{hotel.name}
						</Typography>
					</CardContent>
				</Card>
			</CardActionArea>
		</Box>
	);
};

export default HotelCard;
