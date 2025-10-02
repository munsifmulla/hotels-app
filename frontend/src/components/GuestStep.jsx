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
import { useTranslation } from "react-i18next";

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
	const { t } = useTranslation();

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
				{t("find_or_add_guest")}
			</Typography>
			<Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
				<TextField
					fullWidth
					label={t("search_by_phone_or_govt_id")}
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
				/>
				<Button onClick={handleSearch} variant="contained" sx={{ ml: 2 }}>
					{t("search")}
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
						<Typography>{t("or_add_new_guest")}</Typography>
					</Divider>
					<TextField
						margin="normal"
						required
						fullWidth
						name="first_name"
						label={t("first_name")}
						onChange={handleNewGuestChange}
					/>
					<TextField
						margin="normal"
						fullWidth
						name="last_name"
						label={t("last_name")}
						onChange={handleNewGuestChange}
					/>
					<TextField
						margin="normal"
						required
						fullWidth
						name="email"
						label={t("email")}
						type="email"
						onChange={handleNewGuestChange}
					/>
					<TextField
						margin="normal"
						fullWidth
						name="phone"
						label={t("phone_number")}
						onChange={handleNewGuestChange}
					/>
					<TextField
						margin="normal"
						fullWidth
						name="govt_id_number"
						label={t("government_id")}
						onChange={handleNewGuestChange}
					/>
					<Button
						type="submit"
						variant="contained"
						color="primary"
						sx={{ mt: 2 }}
						disabled={loading}
					>
						{t("add_guest_and_continue")}
					</Button>
				</Box>
			)}
		</Box>
	);
};

export default GuestStep;
