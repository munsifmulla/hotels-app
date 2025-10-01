import React, { createContext, useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
	const [token, setToken] = useState(() => localStorage.getItem("token"));
	const [tokenPayload, setTokenPayload] = useState(null);
	const navigate = useNavigate();

	useEffect(() => {
		if (token) {
			localStorage.setItem("token", token);
			try {
				const payload = JSON.parse(atob(token.split(".")[1]));
				setTokenPayload(payload);
			} catch (e) {
				console.error("Failed to decode token:", e);
				setTokenPayload(null);
				logout(); // Log out if token is malformed
			}
		} else {
			localStorage.removeItem("token");
			setTokenPayload(null);
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

	const getBookingsForRoom = async (roomId) => {
		if (!token) {
			throw new Error("Authentication token not found.");
		}

		const response = await fetch(`/api/bookings/room/${roomId}`, {
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
			throw new Error(data.message || "Failed to fetch bookings for the room");
		}
	};

	const getServices = async (hotelId) => {
		if (!token) throw new Error("Authentication token not found.");
		const response = await fetch(`/api/services/hotel/${hotelId}`, {
			headers: { Authorization: `Bearer ${token}` },
		});
		const data = await response.json();
		if (!response.ok)
			throw new Error(data.message || "Failed to fetch services");
		return data;
	};

	const addService = async (serviceData) => {
		if (!token) throw new Error("Authentication token not found.");
		const response = await fetch(`/api/services/add`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify(serviceData),
		});
		const data = await response.json();
		if (!response.ok) throw new Error(data.message || "Failed to add service");
		return data;
	};

	const updateService = async (serviceId, serviceData) => {
		if (!token) throw new Error("Authentication token not found.");
		const response = await fetch(`/api/services/update`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({ service_id: serviceId, ...serviceData }),
		});
		const data = await response.json();
		if (!response.ok)
			throw new Error(data.message || "Failed to update service");
		return data;
	};

	const removeService = async (serviceId) => {
		if (!token) throw new Error("Authentication token not found.");
		const response = await fetch(`/api/services/remove`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({ service_id: serviceId }),
		});
		const data = await response.json();
		if (!response.ok)
			throw new Error(data.message || "Failed to remove service");
		return data;
	};

	const getServiceTypes = async (hotelId) => {
		if (!token) throw new Error("Authentication token not found.");
		const response = await fetch(`/api/service_types/hotel/${hotelId}`, {
			headers: { Authorization: `Bearer ${token}` },
		});
		const data = await response.json();
		if (!response.ok)
			throw new Error(data.message || "Failed to fetch service types");
		return data;
	};

	const createServiceType = async (serviceTypeData) => {
		if (!token) throw new Error("Authentication token not found.");
		const response = await fetch(`/api/service_types/create`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify(serviceTypeData),
		});
		const data = await response.json();
		if (!response.ok)
			throw new Error(data.message || "Failed to create service type");
		return data;
	};

	const updateServiceType = async (serviceTypeId, serviceTypeData) => {
		if (!token) throw new Error("Authentication token not found.");
		const response = await fetch(`/api/service_types/update`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({
				service_type_id: serviceTypeId,
				...serviceTypeData,
			}),
		});
		const data = await response.json();
		if (!response.ok)
			throw new Error(data.message || "Failed to update service type");
		return data;
	};

	const deleteServiceType = async (serviceTypeId) => {
		if (!token) throw new Error("Authentication token not found.");
		const response = await fetch(`/api/service_types/delete`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({ service_type_id: serviceTypeId }),
		});
		const data = await response.json();
		if (!response.ok)
			throw new Error(data.message || "Failed to delete service type");
		return data;
	};

	const getServicesForBooking = async (bookingId) => {
		if (!token) throw new Error("Authentication token not found.");
		// This is a frontend-only filter for now.
		// For larger scale, you'd create a backend endpoint: /api/services/booking/:bookingId
		const allServices = await getServices(tokenPayload.data.hotelIds[0]); // Assuming one hotel for now
		return allServices.filter((s) => s.booking_id === bookingId);
	};

	const value = {
		token,
		isAuthenticated: !!token,
		tokenPayload,
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
		getBookingsForRoom,
		getServices,
		addService,
		updateService,
		removeService,
		getServiceTypes,
		createServiceType,
		updateServiceType,
		deleteServiceType,
		getServicesForBooking,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;

export const useAuth = () => {
	return useContext(AuthContext);
};
