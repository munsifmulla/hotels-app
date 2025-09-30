import React from "react";
import ReactDOM from "react-dom/client";
import { createHashRouter, RouterProvider } from "react-router-dom";
import "./i18n";
import "./index.css";

import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import ActivatePage from "./pages/ActivatePage.jsx";
import HotelLayout from "./components/HotelLayout.jsx";
import HotelDashboardPage from "./pages/HotelDashboardPage.jsx";
import RoomsPage from "./pages/RoomsPage.jsx";
import RoomTypesPage from "./pages/RoomTypesPage.jsx";
import BookingsPage from "./pages/BookingsPage.jsx";
import App from "./App.jsx";

const router = createHashRouter([
	{
		path: "/",
		element: <App />,
		children: [
			{
				path: "login",
				element: <Layout />,
				children: [{ index: true, element: <LoginPage /> }],
			},
			{
				path: "activate",
				element: <Layout />,
				children: [{ index: true, element: <ActivatePage /> }],
			},
			{
				path: "/",
				element: <Layout />,
				children: [
					{
						element: <ProtectedRoute />,
						children: [{ index: true, element: <LandingPage /> }],
					},
				],
			},
			{
				path: "hotel/:hotelId",
				element: <HotelLayout />,
				children: [
					{
						element: <ProtectedRoute />,
						children: [
							{ index: true, element: <HotelDashboardPage /> },
							{ path: "rooms", element: <RoomsPage /> },
							{ path: "room-types", element: <RoomTypesPage /> },
							{ path: "bookings", element: <BookingsPage /> },
						],
					},
				],
			},
		],
	},
]);

ReactDOM.createRoot(document.getElementById("root")).render(
	<React.StrictMode>
		<RouterProvider router={router} />
	</React.StrictMode>
);
