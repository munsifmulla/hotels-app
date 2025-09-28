<div class="card">
  <div class="card-header bg-success text-white">
    <h2>Password Reset Successful!</h2>
  </div>
  <div class="card-body">
    <p>The password for the user has been updated. Please save the new credentials.</p>

    <div class="form-group">
      <label><strong>Username</strong></label>
      <div class="input-group">
        <input type="text" id="username-field" class="form-control" value="<?php echo html_escape($username); ?>"
          readonly>
        <div class="input-group-append">
          <button class="btn btn-outline-secondary" type="button"
            onclick="copyToClipboard('username-field', this)">Copy</button>
        </div>
      </div>
    </div>

    <div class="form-group">
      <label><strong>New Password</strong></label>
      <div class="input-group">
        <input type="text" id="password-field" class="form-control" value="<?php echo html_escape($new_password); ?>"
          readonly>
        <div class="input-group-append">
          <button class="btn btn-outline-secondary" type="button"
            onclick="copyToClipboard('password-field', this)">Copy</button>
        </div>
      </div>
    </div>

    <a href="<?php echo site_url('users/index'); ?>" class="btn btn-primary">Back to User List</a>
  </div>
</div>

<script>
  function copyToClipboard(elementId, button) {
    // Get the text field
    var copyText = document.getElementById(elementId);

    // Select the text field
    copyText.select();
    copyText.setSelectionRange(0, 99999); // For mobile devices

    // Copy the text inside the text field
    try {
      var successful = document.execCommand('copy');
      var originalText = button.innerHTML;
      button.innerHTML = 'Copied!';
      setTimeout(function () {
        button.innerHTML = originalText;
      }, 2000);
    } catch (err) {
      console.error('Oops, unable to copy', err);
    }

    // Deselect the text
    window.getSelection().removeAllRanges();
  }
</script>
