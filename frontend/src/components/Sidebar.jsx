import React from "react";
import {
	Drawer,
	List,
	ListItem,
	ListItemIcon,
	ListItemText,
} from "@mui/material";
import { NavLink } from "react-router-dom";
import {
	Home as HomeIcon,
	Login as LoginIcon,
	VpnKey as VpnKeyIcon,
	Logout as LogoutIcon,
} from "@mui/icons-material";

const drawerWidth = 240;

const Sidebar = ({ t, i18n, isAuthenticated, logout }) => {
	const drawerContent = (
		<List sx={{ p: 1 }}>
			<ListItem
				button
				component={NavLink}
				to="/"
				end
				sx={(theme) => ({
					borderRadius: "8px",
					"&.active": {
						backgroundColor: theme.palette.primary.main,
						color: theme.palette.primary.contrastText,
						"& .MuiListItemIcon-root": {
							color: theme.palette.primary.contrastText,
						},
						"&:hover": {
							backgroundColor: theme.palette.primary.dark,
						},
					},
				})}
			>
				<ListItemIcon>
					<HomeIcon />
				</ListItemIcon>
				<ListItemText primary={t("dashboard")} />
			</ListItem>
			{!isAuthenticated ? (
				<>
					<ListItem button component={NavLink} to="/login">
						<ListItemIcon>
							<LoginIcon />
						</ListItemIcon>
						<ListItemText primary={t("login")} />
					</ListItem>
					<ListItem button component={NavLink} to="/activate">
						<ListItemIcon>
							<VpnKeyIcon />
						</ListItemIcon>
						<ListItemText primary={t("activate")} />
					</ListItem>
				</>
			) : (
				<ListItem
					button
					onClick={logout}
					sx={{
						borderRadius: "8px",
					}}
				>
					<ListItemIcon>
						<LogoutIcon />
					</ListItemIcon>
					<ListItemText primary={t("logout")} />
				</ListItem>
			)}
		</List>
	);

	return (
		<Drawer
			variant="permanent"
			sx={{
				"& .MuiDrawer-paper": {
					mt: "64px", // Add top margin to push drawer below AppBar
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

export default Sidebar;
