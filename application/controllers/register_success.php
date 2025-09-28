<div class="card">
  <div class="card-header bg-success text-white">
    <h2>Registration Successful!</h2>
  </div>
  <div class="card-body">
    <p>Please save the following credentials. The subscription key will be required for API access.</p>

    <div class="form-group">
      <strong>Username:</strong> <?php echo html_escape($username); ?>
    </div>
    <div class="form-group">
      <strong>Password:</strong> <?php echo html_escape($password); ?>
    </div>
    <div class="form-group">
      <label for="token"><strong>Subscription Key:</strong></label>
      <textarea id="token" readonly class="form-control" rows="6"><?php echo html_escape($token); ?></textarea>
    </div>

    <a href="<?php echo site_url('users/login'); ?>" class="btn btn-primary">Proceed to Login</a>
  </div>
</div>
