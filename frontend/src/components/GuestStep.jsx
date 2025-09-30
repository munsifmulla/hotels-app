import React, { useState, useCallback } from "react";
import {
	Box,
	TextField,
	Button,
	List,
	ListItem,
	ListItemText,
	Typography,
	CircularProgress,
	Divider,
} from "@mui/material";
import { useAuth } from "../context/AuthContext";

const GuestStep = ({ onNext, hotelId }) => {
	const [searchTerm, setSearchTerm] = useState("");
	const [searchResults, setSearchResults] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [showAddForm, setShowAddForm] = useState(false);
	const [newGuest, setNewGuest] = useState({
		first_name: "",
		last_name: "",
		email: "",
		phone: "",
		govt_id_number: "",
	});
	const { searchGuests, createGuest } = useAuth();

	const handleSearch = useCallback(async () => {
		if (!searchTerm.trim()) return;
		setLoading(true);
		setError("");
		try {
			const results = await searchGuests(hotelId, searchTerm);
			setSearchResults(results);
			if (results.length === 0) {
				setShowAddForm(true);
			} else {
				setShowAddForm(false);
			}
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	}, [searchGuests, hotelId, searchTerm]);

	const handleNewGuestChange = (e) => {
		const { name, value } = e.target;
		setNewGuest((prev) => ({ ...prev, [name]: value }));
	};

	const handleAddNewGuest = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError("");
		try {
			const createdGuest = await createGuest({
				hotel_id: hotelId,
				...newGuest,
			});
			onNext(createdGuest); // Proceed to next step with the new guest
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Box>
			<Typography variant="h6" gutterBottom>
				Find or Add Guest
			</Typography>
			<Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
				<TextField
					fullWidth
					label="Search by Phone or Government ID"
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
				/>
				<Button onClick={handleSearch} variant="contained" sx={{ ml: 2 }}>
					Search
				</Button>
			</Box>

			{loading && <CircularProgress />}
			{error && <Typography color="error">{error}</Typography>}

			{!showAddForm && searchResults.length > 0 && (
				<List>
					{searchResults.map((guest) => (
						<ListItem button key={guest.id} onClick={() => onNext(guest)}>
							<ListItemText
								primary={`${guest.first_name} ${guest.last_name}`}
								secondary={guest.email}
							/>
						</ListItem>
					))}
				</List>
			)}

			{showAddForm && (
				<Box component="form" onSubmit={handleAddNewGuest}>
					<Divider sx={{ my: 2 }}>
						<Typography>Or Add New Guest</Typography>
					</Divider>
					<TextField
						margin="normal"
						required
						fullWidth
						name="first_name"
						label="First Name"
						onChange={handleNewGuestChange}
					/>
					<TextField
						margin="normal"
						fullWidth
						name="last_name"
						label="Last Name"
						onChange={handleNewGuestChange}
					/>
					<TextField
						margin="normal"
						required
						fullWidth
						name="email"
						label="Email"
						type="email"
						onChange={handleNewGuestChange}
					/>
					<TextField
						margin="normal"
						fullWidth
						name="phone"
						label="Phone Number"
						onChange={handleNewGuestChange}
					/>
					<TextField
						margin="normal"
						fullWidth
						name="govt_id_number"
						label="Government ID"
						onChange={handleNewGuestChange}
					/>
					<Button
						type="submit"
						variant="contained"
						color="primary"
						sx={{ mt: 2 }}
						disabled={loading}
					>
						Add Guest & Continue
					</Button>
				</Box>
			)}
		</Box>
	);
};

export default GuestStep;
