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
