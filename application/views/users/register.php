<div class="mb-3">
  <a href="<?php echo site_url('users/index'); ?>">&laquo; Back to User List</a>
</div>

<div class="card">
  <div class="card-header">
    <h2>Register New User</h2>
  </div>
  <div class="card-body">
    <?php if (isset($error)): ?>
      <div class="alert alert-danger"><?php echo $error; ?></div>
    <?php endif; ?>

    <?php echo validation_errors('<div class="alert alert-danger">', '</div>'); ?>

    <?php echo form_open('users/register'); ?>

    <div class="form-group">
      <label for="username">Username</label>
      <input type="text" name="username" class="form-control" value="<?php echo set_value('username'); ?>" />
    </div>
    <div class="form-group">
      <label for="email">Email Address (Optional)</label>
      <input type="text" name="email" class="form-control" value="<?php echo set_value('email'); ?>" />
    </div>
    <div class="form-group">
      <label for="business_name">Business Name</label>
      <input type="text" name="business_name" class="form-control" value="<?php echo set_value('business_name'); ?>" />
    </div>
    <div class="form-group">
      <label for="business_name_lang">Business Name (Second Language)</label>
      <input type="text" name="business_name_lang" class="form-control"
        value="<?php echo set_value('business_name_lang'); ?>" />
    </div>
    <div class="form-group">
      <label for="trn_number">TRN Number</label>
      <input type="text" name="trn_number" class="form-control" value="<?php echo set_value('trn_number'); ?>" />
    </div>
    <div class="form-group">
      <label for="business_address">Business Address (Optional)</label>
      <textarea name="business_address" class="form-control"
        rows="3"><?php echo set_value('business_address'); ?></textarea>
    </div>
    <div class="form-group">
      <label for="phone_number">Phone Number (Optional)</label>
      <input type="text" name="phone_number" class="form-control" value="<?php echo set_value('phone_number'); ?>" />
    </div>
    <div class="form-group">
      <label for="password">Password</label>
      <input type="password" name="password" class="form-control" value="" />
    </div>

    <button type="submit" class="btn btn-primary">Register User</button>
    <a href="<?php echo site_url('users/index'); ?>" class="btn btn-secondary">Cancel</a>

    </form>
  </div>
</div>
