import React, { useState, useEffect } from "react";
import {
	AppBar,
	Toolbar,
	Typography,
	CssBaseline,
	Box,
	ThemeProvider,
	Switch,
	FormControlLabel,
} from "@mui/material";
import { Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { getTheme } from "../theme";
import HotelSidebar from "./HotelSidebar";

const drawerWidth = 240;

const HotelLayout = () => {
	const { t, i18n } = useTranslation();
	const [theme, setTheme] = useState(getTheme("ltr"));

	useEffect(() => {
		const direction = i18n.language === "ar" ? "rtl" : "ltr";
		document.body.dir = direction;
		setTheme(getTheme(direction));
	}, [i18n.language]);

	const handleLanguageChange = (event) => {
		const newLang = event.target.checked ? "ar" : "en";
		i18n.changeLanguage(newLang);
	};

	return (
		<ThemeProvider theme={theme}>
			<Box sx={{ display: "flex" }}>
				<CssBaseline />
				<AppBar
					position="fixed"
					sx={{
						width: "100%",
					}}
				>
					<Toolbar>
						<Typography
							variant="h6"
							noWrap
							component="div"
							sx={{
								flexGrow: 1,
								fontWeight: 400,
								color: "white",
								letterSpacing: ".1rem",
								fontSize: { xs: "1.8rem", sm: "1.5rem" },
							}}
						>
							<span style={{ fontWeight: 700 }}>Alpha</span> hotels
						</Typography>
						<FormControlLabel
							sx={{ color: "white" }}
							control={
								<Switch
									checked={i18n.language === "ar"}
									onChange={handleLanguageChange}
									color="default"
								/>
							}
							label={i18n.language === "ar" ? "English" : "العربية"}
						/>
					</Toolbar>
				</AppBar>
				<Box
					component="nav"
					sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
				>
					<HotelSidebar t={t} i18n={i18n} />
				</Box>
				<Box
					component="main"
					sx={{
						flexGrow: 1,
						p: 3,
						width: { sm: `calc(100% - ${drawerWidth}px)` },
					}}
				>
					<Toolbar />
					<Outlet />
				</Box>
			</Box>
		</ThemeProvider>
	);
};

export default HotelLayout;
