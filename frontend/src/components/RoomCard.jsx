import React from "react";
import {
	Button,
	Card,
	CardContent,
	Typography,
	Box,
	Chip,
	Divider,
	Grid,
	IconButton,
} from "@mui/material";
import {
	Bed,
	Bathtub,
	Tv,
	Kitchen,
	AcUnit,
	CheckCircle,
	Cancel,
	Edit as EditIcon,
	Delete as DeleteIcon,
} from "@mui/icons-material";

const Amenity = ({ icon, label, available }) => (
	<Box sx={{ display: "flex", alignItems: "center", mr: 2 }}>
		{React.cloneElement(icon, {
			fontSize: "small",
			color: available ? "success" : "disabled",
		})}
		<Typography
			variant="body2"
			sx={{ ml: 0.5, color: available ? "text.primary" : "text.disabled" }}
		>
			{label}
		</Typography>
	</Box>
);

const RoomCard = ({ room, roomType, t, onEdit, onDelete, onBook }) => {
	const statusColors = {
		vacant: "success",
		occupied: "warning",
		maintenance: "error",
	};

	return (
		<Card
			sx={{
				border: "1px solid",
				borderColor: "divider",
				borderRadius: 2,
				height: "100%",
				display: "flex",
				flexDirection: "column",
			}}
		>
			<CardContent sx={{ flexGrow: 1 }}>
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						mb: 2,
					}}
				>
					<Typography variant="h6" sx={{ flexGrow: 1 }}>
						{t("room_prefix")} {room.room_number}
					</Typography>
					<Box>
						<IconButton
							size="small"
							onClick={() => onEdit(room)}
							sx={{ mr: 0.5 }}
						>
							<EditIcon fontSize="small" />
						</IconButton>
						<IconButton
							size="small"
							onClick={() => onDelete(room)}
							color="error"
						>
							<DeleteIcon fontSize="small" />
						</IconButton>
					</Box>
				</Box>
				{roomType && (
					<Typography variant="body2" color="text.secondary" gutterBottom>
						{roomType.name}
					</Typography>
				)}

				<Typography color="primary" variant="h5" sx={{ mb: 2 }}>
					{t("currency")} {room.price_per_night}
					<Typography variant="caption" color="text.secondary">
						{t("room_night")}
					</Typography>
				</Typography>

				<Divider sx={{ my: 2 }} />

				<Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
					<Amenity
						icon={<Bed />}
						label={t("beds", { count: room.number_of_beds })}
						available
					/>
					<Amenity
						icon={<Bathtub />}
						label={t("baths", { count: room.number_of_bathrooms })}
						available
					/>
				</Box>

				<Grid container spacing={1}>
					<Grid item xs={6}>
						<Amenity icon={<Tv />} label={t("tv")} available={!!+room.has_tv} />
					</Grid>
					<Grid item xs={6}>
						<Amenity
							icon={<AcUnit />}
							label={t("ac")}
							available={!!+room.has_ac}
						/>
					</Grid>
					<Grid item xs={6}>
						<Amenity
							icon={<Kitchen />}
							label={t("kitchen")}
							available={!!+room.has_kitchen}
						/>
					</Grid>
					<Grid item xs={6}>
						<Amenity
							icon={<Kitchen />} // Assuming this was a typo and should be a fridge icon
							label={t("fridge")}
							available={!!+room.has_fridge}
						/>
					</Grid>
				</Grid>
			</CardContent>
			<Box sx={{ p: 2, pt: 0 }}>
				<Button fullWidth variant="contained" onClick={() => onBook(room)}>
					Book Now
				</Button>
			</Box>
		</Card>
	);
};

export default RoomCard;
