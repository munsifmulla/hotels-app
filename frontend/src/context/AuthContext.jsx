import React, { createContext, useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
	const [token, setToken] = useState(() => localStorage.getItem("token"));
	const navigate = useNavigate();

	useEffect(() => {
		if (token) {
			localStorage.setItem("token", token);
		} else {
			localStorage.removeItem("token");
		}
	}, [token]);

	const login = async (username, password) => {
		const response = await fetch("/api/login", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ username, password }),
		});

		const data = await response.json();

		if (response.ok) {
			setToken(data.token);
			if (data.status === "success") {
				navigate("/");
			} else if (data.status === "inactive") {
				navigate("/activate");
			}
		} else {
			throw new Error(data.message || "Login failed");
		}
	};

	const logout = () => {
		setToken(null);
		navigate("/login");
	};

	const activateKey = async (activationKey) => {
		if (!token) {
			throw new Error("Authentication token not found.");
		}

		const response = await fetch("/api/activate_key", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({ app_activation_key: activationKey }),
		});

		const data = await response.json();

		if (response.ok) {
			// On success, return the response data to the component
			return data;
		} else {
			// Throw an error for the component to catch and display
			throw new Error(data.message || "Activation failed");
		}
	};

	const getHotels = async () => {
		if (!token) {
			throw new Error("Authentication token not found.");
		}

		const response = await fetch("/api/hotels", {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
		});

		const data = await response.json();

		if (response.ok) {
			return data;
		} else {
			throw new Error(data.message || "Failed to fetch hotels");
		}
	};

	const getRooms = async (hotelId) => {
		if (!token) {
			throw new Error("Authentication token not found.");
		}

		const response = await fetch(`/api/rooms/${hotelId}`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
		});

		const data = await response.json();

		if (response.ok) {
			return data;
		} else {
			throw new Error(data.message || "Failed to fetch rooms");
		}
	};

	const getRoomTypes = async (hotelId) => {
		if (!token) {
			throw new Error("Authentication token not found.");
		}

		const response = await fetch(`/api/room_types/${hotelId}`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
		});

		const data = await response.json();

		if (response.ok) {
			return data;
		} else {
			throw new Error(data.message || "Failed to fetch room types");
		}
	};

	const createRoomType = async (hotelId, name, description) => {
		if (!token) {
			throw new Error("Authentication token not found.");
		}

		const response = await fetch(`/api/room_types/create`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({
				hotel_id: hotelId,
				name,
				description,
			}),
		});

		const data = await response.json();

		if (response.ok) {
			return data;
		} else {
			throw new Error(data.message || "Failed to create room type");
		}
	};

	const updateRoomType = async (roomTypeId, name, description) => {
		if (!token) {
			throw new Error("Authentication token not found.");
		}

		const response = await fetch(`/api/room_types/update`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({
				room_type_id: roomTypeId,
				name,
				description,
			}),
		});

		const data = await response.json();

		if (response.ok) {
			return data;
		} else {
			throw new Error(data.message || "Failed to update room type");
		}
	};

	const deleteRoomType = async (roomTypeId) => {
		if (!token) {
			throw new Error("Authentication token not found.");
		}

		const response = await fetch(`/api/room_types/delete`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({ room_type_id: roomTypeId }),
		});

		const data = await response.json();

		if (response.ok) {
			return data;
		} else {
			throw new Error(data.message || "Failed to delete room type");
		}
	};

	const createRoom = async (roomData) => {
		if (!token) {
			throw new Error("Authentication token not found.");
		}

		const response = await fetch(`/api/rooms/create`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify(roomData),
		});

		const data = await response.json();

		if (response.ok) {
			return data;
		} else {
			throw new Error(data.message || "Failed to create room");
		}
	};

	const updateRoom = async (roomId, roomData) => {
		if (!token) {
			throw new Error("Authentication token not found.");
		}

		const response = await fetch(`/api/rooms/update`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({ room_id: roomId, ...roomData }),
		});

		const data = await response.json();

		if (response.ok) {
			return data;
		} else {
			throw new Error(data.message || "Failed to update room");
		}
	};

	const deleteRoom = async (roomId) => {
		if (!token) {
			throw new Error("Authentication token not found.");
		}

		const response = await fetch(`/api/rooms/delete`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({ room_id: roomId }),
		});

		const data = await response.json();

		if (response.ok) {
			return data;
		} else {
			throw new Error(data.message || "Failed to delete room");
		}
	};

	const searchGuests = async (hotelId, searchTerm) => {
		if (!token) {
			throw new Error("Authentication token not found.");
		}

		const response = await fetch(
			`/api/guests/search/${hotelId}?q=${searchTerm}`,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
			}
		);

		const data = await response.json();

		if (response.ok) {
			return data;
		} else {
			throw new Error(data.message || "Failed to search guests");
		}
	};

	const createGuest = async (guestData) => {
		if (!token) {
			throw new Error("Authentication token not found.");
		}

		const response = await fetch(`/api/guests/create`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify(guestData),
		});

		const data = await response.json();

		if (response.ok) {
			return data;
		} else {
			throw new Error(data.message || "Failed to create guest");
		}
	};

	const createBooking = async (bookingData) => {
		if (!token) {
			throw new Error("Authentication token not found.");
		}

		const response = await fetch(`/api/bookings/create`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify(bookingData),
		});

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.message || "Failed to create booking");
		}
		return data;
	};

	const getBookings = async (hotelId) => {
		if (!token) {
			throw new Error("Authentication token not found.");
		}

		const response = await fetch(`/api/bookings/hotel/${hotelId}`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
		});

		const data = await response.json();

		if (response.ok) {
			return data;
		} else {
			throw new Error(data.message || "Failed to fetch bookings");
		}
	};

	const getGuests = async (hotelId) => {
		if (!token) {
			throw new Error("Authentication token not found.");
		}

		const response = await fetch(`/api/guests/hotel/${hotelId}`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
		});

		const data = await response.json();

		if (response.ok) {
			return data;
		} else {
			throw new Error(data.message || "Failed to fetch guests");
		}
	};

	const createInvoice = async (invoiceData) => {
		if (!token) {
			throw new Error("Authentication token not found.");
		}

		const response = await fetch(`/api/invoices/create`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify(invoiceData),
		});

		const data = await response.json();

		if (response.ok) {
			return data;
		} else {
			throw new Error(data.message || "Failed to create invoice");
		}
	};

	const updateBooking = async (bookingId, bookingData) => {
		if (!token) {
			throw new Error("Authentication token not found.");
		}

		const response = await fetch(`/api/bookings/update`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({ booking_id: bookingId, ...bookingData }),
		});

		const data = await response.json();

		if (response.ok) {
			return data;
		} else {
			throw new Error(data.message || "Failed to update booking");
		}
	};

	const getGuest = async (guestId) => {
		if (!token) {
			throw new Error("Authentication token not found.");
		}

		const response = await fetch(`/api/guests/${guestId}`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
		});

		const data = await response.json();

		if (response.ok) {
			return data;
		} else {
			throw new Error(data.message || "Failed to fetch guest");
		}
	};

	const getInvoiceByBookingId = async (bookingId) => {
		if (!token) {
			throw new Error("Authentication token not found.");
		}

		const response = await fetch(`/api/invoices/booking/${bookingId}`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
		});

		// If no invoice is found (404), we return null, which is not an error in this case.
		if (response.status === 404) {
			return null;
		}

		const data = await response.json();

		if (response.ok) {
			return data;
		} else {
			throw new Error(data.message || "Failed to fetch invoice");
		}
	};

	const value = {
		token,
		isAuthenticated: !!token,
		login,
		logout,
		activateKey,
		getHotels,
		getRooms,
		getRoomTypes,
		createRoomType,
		updateRoomType,
		deleteRoomType,
		createRoom,
		updateRoom,
		deleteRoom,
		searchGuests,
		createGuest,
		createBooking,
		getBookings,
		getGuests,
		createInvoice,
		updateBooking,
		getGuest,
		getInvoiceByBookingId,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;

export const useAuth = () => {
	return useContext(AuthContext);
};
