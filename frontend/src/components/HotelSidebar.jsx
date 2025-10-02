import React from "react";
import {
	Drawer,
	List,
	ListItem,
	ListItemIcon,
	ListItemText,
} from "@mui/material";
import { NavLink, useParams } from "react-router-dom";
import {
	Dashboard as DashboardIcon,
	MeetingRoom as MeetingRoomIcon,
	BookOnline as BookOnlineIcon,
	People as PeopleIcon,
	Category as CategoryIcon,
	MiscellaneousServices as ServicesIcon,
	ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";

const drawerWidth = 240;

const HotelSidebar = ({ t, i18n }) => {
	const { hotelId } = useParams();

	const drawerContent = (
		<List sx={{ p: 1 }}>
			<ListItem
				button
				component={NavLink}
				to="/"
				sx={{ color: "primary.main", borderRadius: "8px" }}
			>
				<ListItemIcon>
					<ArrowBackIcon color="primary" />
				</ListItemIcon>
				<ListItemText primary={t("main_dashboard")} />
			</ListItem>
			<ListItem
				button
				component={NavLink}
				to={`/hotel/${hotelId}`}
				end
				sx={(theme) => ({
					borderRadius: "8px",
					color: "text.secondary",
					"& .MuiListItemIcon-root": {
						color: "text.secondary",
					},
					"&.active": {
						backgroundColor: theme.palette.primary.main,
						color: theme.palette.primary.contrastText,
						"& .MuiListItemIcon-root": {
							color: theme.palette.primary.contrastText,
						},
					},
				})}
			>
				<ListItemIcon>
					<DashboardIcon />
				</ListItemIcon>
				<ListItemText primary={t("hotel_dashboard")} />
			</ListItem>
			<ListItem
				button
				component={NavLink}
				to={`/hotel/${hotelId}/rooms`}
				sx={(theme) => ({
					borderRadius: "8px",
					color: "text.secondary",
					"& .MuiListItemIcon-root": {
						color: "text.secondary",
					},
					"&.active": {
						backgroundColor: theme.palette.primary.main,
						color: theme.palette.primary.contrastText,
						"& .MuiListItemIcon-root": {
							color: theme.palette.primary.contrastText,
						},
					},
				})}
			>
				<ListItemIcon>
					<MeetingRoomIcon />
				</ListItemIcon>
				<ListItemText primary={t("rooms")} />
			</ListItem>
			<ListItem
				button
				component={NavLink}
				to={`/hotel/${hotelId}/bookings`}
				sx={(theme) => ({
					borderRadius: "8px",
					color: "text.secondary",
					"& .MuiListItemIcon-root": {
						color: "text.secondary",
					},
					"&.active": {
						backgroundColor: theme.palette.primary.main,
						color: theme.palette.primary.contrastText,
						"& .MuiListItemIcon-root": {
							color: theme.palette.primary.contrastText,
						},
					},
				})}
			>
				<ListItemIcon>
					<BookOnlineIcon />
				</ListItemIcon>
				<ListItemText primary={t("bookings")} />
			</ListItem>
			<ListItem
				button
				component={NavLink}
				to={`/hotel/${hotelId}/room-types`}
				sx={(theme) => ({
					borderRadius: "8px",
					color: "text.secondary",
					"& .MuiListItemIcon-root": {
						color: "text.secondary",
					},
					"&.active": {
						backgroundColor: theme.palette.primary.main,
						color: theme.palette.primary.contrastText,
						"& .MuiListItemIcon-root": {
							color: theme.palette.primary.contrastText,
						},
					},
				})}
			>
				<ListItemIcon>
					<CategoryIcon />
				</ListItemIcon>
				<ListItemText primary={t("room_types")} />
			</ListItem>
			<ListItem
				button
				component={NavLink}
				to={`/hotel/${hotelId}/service-types`}
				sx={(theme) => ({
					borderRadius: "8px",
					color: "text.secondary",
					"& .MuiListItemIcon-root": {
						color: "text.secondary",
					},
					"&.active": {
						backgroundColor: theme.palette.primary.main,
						color: theme.palette.primary.contrastText,
						"& .MuiListItemIcon-root": {
							color: theme.palette.primary.contrastText,
						},
					},
				})}
			>
				<ListItemIcon>
					<CategoryIcon />
				</ListItemIcon>
				<ListItemText primary={t("service_types")} />
			</ListItem>
		</List>
	);

	return (
		<Drawer
			variant="permanent"
			sx={{
				"& .MuiDrawer-paper": {
					mt: "64px",
					boxSizing: "border-box",
					width: drawerWidth,
				},
			}}
			open
			anchor={i18n.language === "ar" ? "right" : "left"}
		>
			{drawerContent}
		</Drawer>
	);
};

export default HotelSidebar;
