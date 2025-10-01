import { createTheme } from "@mui/material/styles";

export const getTheme = (direction) =>
	createTheme({
		direction: direction,
		palette: {
			primary: {
				main: "#d26060ff", // A shade of blue
			},
			secondary: {
				main: "#dc004e", // An action color
			},
			background: {
				default: "#f4f6f8", // Light gray
				paper: "#ffffff", // White
			},
		},
	});
