import React, { useState } from "react";
import { Modal, Box, Stepper, Step, StepLabel } from "@mui/material";
import GuestStep from "./GuestStep";
import BookingStep from "./BookingStep";
import { useTranslation } from "react-i18next";

const modalStyle = {
	position: "absolute",
	top: "50%",
	left: "50%",
	transform: "translate(-50%, -50%)",
	width: { xs: "90%", sm: 600 },
	bgcolor: "background.paper",
	boxShadow: 24,
	p: 4,
	borderRadius: 2,
};

const BookingModal = ({ open, onClose, room, hotelId }) => {
	const { t } = useTranslation();
	const [activeStep, setActiveStep] = useState(0);
	const [selectedGuest, setSelectedGuest] = useState(null);

	const steps = [t("select_guest"), t("confirm_booking")];

	const handleNext = (guest) => {
		setSelectedGuest(guest);
		setActiveStep((prevActiveStep) => prevActiveStep + 1);
	};

	const handleBack = () => {
		setActiveStep((prevActiveStep) => prevActiveStep - 1);
	};

	const handleClose = () => {
		onClose();
		// Reset state after a short delay to allow modal to close
		setTimeout(() => {
			setActiveStep(0);
			setSelectedGuest(null);
		}, 300);
	};

	return (
		<Modal open={open} onClose={handleClose}>
			<Box sx={modalStyle}>
				<Stepper activeStep={activeStep} sx={{ mb: 3 }}>
					{steps.map((label) => (
						<Step key={label}>
							<StepLabel>{label}</StepLabel>
						</Step>
					))}
				</Stepper>
				{activeStep === 0 && (
					<GuestStep onNext={handleNext} hotelId={hotelId} />
				)}
				{activeStep === 1 && (
					<BookingStep
						onBack={handleBack}
						guest={selectedGuest}
						room={room}
						hotelId={hotelId}
						onBookingSuccess={handleClose}
					/>
				)}
			</Box>
		</Modal>
	);
};

export default BookingModal;
