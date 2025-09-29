$(document).ready(function () {
	// Check if the modal exists on the page before attaching events
	if ($("#resetPasswordModal").length) {
		// Using jQuery for Bootstrap modal events
		$("#resetPasswordModal").on("show.bs.modal", function (event) {
			var button = $(event.relatedTarget); // Button that triggered the modal
			var userId = button.data("userid"); // Extract info from data-* attributes
			var username = button.data("username");

			var modal = $(this);
			modal.find(".modal-title #reset-username").text(username);
			modal.find(".modal-body #reset-user-id").val(userId);

			// Reset modal to initial state
			$("#reset-form-container").show();
			$("#reset-success-container").hide();
			$("#reset-error").hide();
			$("#reset-submit-btn").show();
			$("#resetPasswordForm")[0].reset();
		});

		$("#resetPasswordForm").on("submit", function (e) {
			e.preventDefault(); // Prevent default form submission
			var form = $(this);
			$.ajax({
				type: "POST",
				url: form.attr("action"),
				data: form.serialize(),
				dataType: "json",
				success: function (response) {
					if (response.status === "success") {
						$("#reset-form-container").hide();
						$("#reset-success-container").show();
						$("#new-password-field").val(response.new_password);
						$("#reset-submit-btn").hide();
					} else {
						$("#reset-error").html(response.message).show();
					}
				},
			});
		});
	}

	// Check if the edit modal exists
	if ($("#editUserModal").length) {
		$("#editUserModal").on("show.bs.modal", function (event) {
			var button = $(event.relatedTarget);
			var userId = button.data("userid");
			var username = button.data("username");
			var email = button.data("email");
			var businessname = button.data("businessname");

			var modal = $(this);
			modal.find(".modal-title #edit-username-title").text(username);
			modal.find(".modal-body #edit-user-id").val(userId);
			modal.find(".modal-body #edit-username").val(username);
			modal.find(".modal-body #edit-email").val(email);
			modal.find(".modal-body #edit-business-name").val(businessname);

			// Reset any previous error messages
			$("#edit-error").hide();
		});

		$("#editUserForm").on("submit", function (e) {
			e.preventDefault();
			var form = $(this);
			$.ajax({
				type: "POST",
				url: form.attr("action"),
				data: form.serialize(),
				dataType: "json",
				success: function (response) {
					if (response.status === "success") {
						// Update the table row with the new data
						var row = $('a[data-userid="' + response.user.id + '"]').closest(
							"tr"
						);
						row.find("td:nth-child(2)").text(response.user.username);
						row.find("td:nth-child(3)").text(response.user.business_name);

						// Update the data attributes on the edit button
						row
							.find(".btn-info")
							.data("username", response.user.username)
							.data("email", response.user.email)
							.data("businessname", response.user.business_name);

						$("#editUserModal").modal("hide");
					} else {
						$("#edit-error").html(response.message).show();
					}
				},
			});
		});
	}

	// Check if the delete modal exists
	if ($("#deleteUserModal").length) {
		$("#deleteUserModal").on("show.bs.modal", function (event) {
			var button = $(event.relatedTarget);
			var userId = button.data("userid");
			var username = button.data("username");

			var modal = $(this);
			modal.find(".modal-body #delete-user-id").val(userId);
			modal.find(".modal-body #delete-username").text(username);
		});

		$("#deleteUserForm").on("submit", function (e) {
			e.preventDefault();
			var form = $(this);
			$.ajax({
				type: "POST",
				url: form.attr("action"),
				data: form.serialize(),
				dataType: "json",
				success: function (response) {
					if (response.status === "success") {
						$("#deleteUserModal").modal("hide");
						location.reload(); // Reload to see changes
					} else {
						// You can add an error message display here if needed
						alert("Error: " + response.message);
						$("#deleteUserModal").modal("hide");
					}
				},
			});
		});
	}

	// Check if the add hotel form exists
	if ($("#addHotelForm").length) {
		$("#addHotelForm").on("submit", function (e) {
			e.preventDefault();
			var form = $(this);
			$.ajax({
				type: "POST",
				url: form.attr("action"),
				data: form.serialize(),
				dataType: "json",
				success: function (response) {
					if (response.status === "success") {
						location.reload(); // Reload to see the new hotel in the list
					} else {
						alert("Error: " + response.message);
					}
				},
			});
		});
	}

	// Check if the edit hotel modal exists
	if ($("#editHotelModal").length) {
		$("#editHotelModal").on("show.bs.modal", function (event) {
			var button = $(event.relatedTarget);
			var hotelId = button.data("hotel-id");
			var hotelName = button.data("hotel-name");
			var hotelAddress = button.data("hotel-address");

			var modal = $(this);
			modal.find(".modal-title").text("Edit " + hotelName);
			modal.find("#edit-hotel-id").val(hotelId);
			modal.find("#edit-hotel-name").val(hotelName);
			modal.find("#edit-hotel-address").val(hotelAddress);
			$("#edit-hotel-error").hide();
		});

		$("#editHotelForm").on("submit", function (e) {
			e.preventDefault();
			var form = $(this);
			$.ajax({
				type: "POST",
				url: form.attr("action"),
				data: form.serialize(),
				dataType: "json",
				success: function (response) {
					if (response.status === "success") {
						// Update the hotel name in the table
						$("#hotel-name-" + response.hotel.id).text(response.hotel.name);

						// Update the data attributes on the edit button
						var editButton = $(
							'button[data-hotel-id="' +
								response.hotel.id +
								'"][data-target="#editHotelModal"]'
						);
						editButton.data("hotel-name", response.hotel.name);
						editButton.data("hotel-address", response.hotel.address);

						$("#editHotelModal").modal("hide");
					} else {
						$("#edit-hotel-error").html(response.message).show();
					}
				},
			});
		});
	}

	// Check if the remove hotel modal exists
	if ($("#removeHotelModal").length) {
		$("#removeHotelModal").on("show.bs.modal", function (event) {
			var button = $(event.relatedTarget);
			var userId = button.data("user-id");
			var hotelId = button.data("hotel-id");
			var hotelName = button.data("hotel-name");

			var modal = $(this);
			modal.find("#remove-user-id").val(userId);
			modal.find("#remove-hotel-id").val(hotelId);
			modal.find("#remove-hotel-name").text(hotelName);
		});

		$("#removeHotelForm").on("submit", function (e) {
			e.preventDefault();
			var form = $(this);
			var hotelId = form.find("#remove-hotel-id").val();
			$.ajax({
				type: "POST",
				url: form.attr("action"),
				data: form.serialize(),
				dataType: "json",
				success: function (response) {
					if (response.status === "success") {
						$("#hotel-row-" + hotelId).remove();
						$("#removeHotelModal").modal("hide");
					} else {
						alert("Error: " + response.message);
					}
				},
			});
		});
	}

	// Check if the create key modal exists
	if ($("#createKeyModal").length) {
		$("#createKeyModal").on("show.bs.modal", function (event) {
			// Reset form to initial state
			$("#key-form-container").show();
			$("#key-success-container").hide();
			$("#create-key-error").hide();
			$("#create-key-submit-btn").show();
			$("#createKeyForm")[0].reset();
		});

		$("#createKeyForm").on("submit", function (e) {
			e.preventDefault();
			var form = $(this);
			$.ajax({
				type: "POST",
				url: form.attr("action"),
				data: form.serialize(),
				dataType: "json",
				success: function (response) {
					if (response.status === "success") {
						$("#key-form-container").hide();
						$("#key-success-container").show();
						$("#new-key-id-field").val(response.encrypted_id);
						$("#create-key-submit-btn").hide();

						// Add a click handler for the new copy button
						$("#copy-new-key-id-btn").on("click", function () {
							copyKeyToClipboard(response.encrypted_id, this);
						});

						// We add a listener to the modal close to reload the page
						$("#createKeyModal").on("hidden.bs.modal", function () {
							window.location.reload();
						});
					} else {
						$("#create-key-error").html(response.message).show();
					}
				},
				error: function () {
					$("#create-key-error").html("An unexpected error occurred.").show();
				},
			});
		});
	}
	// Check if the delete key modal exists
	if ($("#deleteKeyModal").length) {
		$("#deleteKeyModal").on("show.bs.modal", function (event) {
			var button = $(event.relatedTarget);
			var keyId = button.data("key-id");
			var keyDisplayId = button.data("key-display-id");

			var modal = $(this);
			modal.find("#delete-key-id").val(keyId);
			modal.find("#delete-key-display-id").text(keyDisplayId);
		});

		$("#deleteKeyForm").on("submit", function (e) {
			e.preventDefault();
			var form = $(this);
			$.ajax({
				type: "POST",
				url: form.attr("action"),
				data: form.serialize(),
				dataType: "json",
				success: function (response) {
					if (response.status === "success") {
						$("#deleteKeyModal").modal("hide");
						location.reload();
					} else {
						alert("Error: " + response.message);
					}
				},
				error: function () {
					alert("An unexpected error occurred.");
				},
			});
		});
	}
});

function copyToClipboard(elementId, button) {
	var copyText = document.getElementById(elementId);
	copyText.select();
	copyText.setSelectionRange(0, 99999);
	document.execCommand("copy");
	var originalText = button.innerHTML;
	button.innerHTML = "Copied!";
	setTimeout(function () {
		button.innerHTML = originalText;
	}, 2000);
	window.getSelection().removeAllRanges();
}

function copyKeyToClipboard(token, button) {
	if (!navigator.clipboard) {
		alert("Clipboard API not available. Please copy the key manually.");
		return;
	}
	navigator.clipboard
		.writeText(token)
		.then(function () {
			var originalIcon = button.innerHTML;
			var originalTitle = button.title;
			button.innerHTML = '<i class="fa fa-check text-success"></i>';
			button.title = "Copied!";
			setTimeout(function () {
				button.innerHTML = originalIcon;
				button.title = originalTitle;
			}, 2000);
		})
		.catch(function (err) {
			console.error("Could not copy text: ", err);
			alert("Failed to copy the key.");
		});
}
