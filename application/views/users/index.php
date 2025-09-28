<div class="card">
  <div class="card-header d-flex justify-content-between align-items-center">
    <h2>User Management</h2>
    <a href="<?php echo site_url('users/register'); ?>" class="btn btn-primary">Add New User</a>
  </div>
  <div class="card-body">
    <?php if ($this->session->flashdata('success')): ?>
      <div class="alert alert-success">
        <?php echo $this->session->flashdata('success'); ?>
      </div>
    <?php endif; ?>

    <form action="<?php echo site_url('users/index'); ?>" method="get" class="form-inline mb-3">
      <div class="form-group">
        <input type="text" name="search" class="form-control" placeholder="Search by username or business name"
          value="<?php echo html_escape($search); ?>" style="width: 300px;" />
      </div>
      <button type="submit" class="btn btn-primary ml-2">Search</button>
      <a href="<?php echo site_url('users/index'); ?>" class="btn btn-secondary ml-2">Clear</a>
    </form>

    <table class="table table-striped">
      <thead>
        <tr>
          <th>ID</th>
          <th>Username</th>
          <th>Business Name</th>
          <th>Password</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <?php if (!empty($users)): ?>
          <?php foreach ($users as $user): ?>
            <tr>
              <td><?php echo $user['id']; ?></td>
              <td><?php echo html_escape($user['username']); ?></td>
              <td><?php echo html_escape($user['business_name']); ?></td>
              <td>
                <div class="input-group">
                  <span id="password-<?php echo $user['id']; ?>" class="form-control"
                    style="border: none; background: transparent; padding-left: 0;">****</span>
                  <div class="input-group-append">
                    <button class="btn btn-sm btn-outline-secondary" type="button" title="Reset Password"
                      data-toggle="modal" data-target="#resetPasswordModal" data-userid="<?php echo $user['id']; ?>"
                      data-username="<?php echo html_escape($user['username']); ?>">
                      <i class="fa fa-eye" id="eye-icon-<?php echo $user['id']; ?>"></i>
                    </button>
                  </div>
                </div>
              </td>
              <td>
                <a href="#" class="btn btn-sm btn-info" data-toggle="modal" data-target="#editUserModal"
                  data-userid="<?php echo $user['id']; ?>" data-username="<?php echo html_escape($user['username']); ?>"
                  data-email="<?php echo html_escape($user['email']); ?>"
                  data-businessname="<?php echo html_escape($user['business_name']); ?>">Edit</a>
                <a href="#" class="btn btn-sm btn-danger" data-toggle="modal" data-target="#deleteUserModal"
                  data-userid="<?php echo $user['id']; ?>"
                  data-username="<?php echo html_escape($user['username']); ?>">Delete</a>
                <a href="#" class="btn btn-sm btn-secondary">Manage Key</a>
              </td>
            </tr>
          <?php endforeach; ?>
        <?php else: ?>
          <tr>
            <td colspan="5" class="text-center">No users found.</td>
          </tr>
        <?php endif; ?>
      </tbody>
    </table>
  </div>
</div>

<!-- Reset Password Modal -->
<div class="modal fade" id="resetPasswordModal" tabindex="-1" role="dialog" aria-labelledby="resetPasswordModalLabel"
  aria-hidden="true">
  <div class="modal-dialog" role="document">
    <div class="modal-content">
      <form id="resetPasswordForm" action="<?php echo site_url('users/reset_password'); ?>" method="post">
        <div class="modal-header">
          <h5 class="modal-title" id="resetPasswordModalLabel">Reset Password for <span id="reset-username"></span></h5>
          <button type="button" class="close" data-dismiss="modal" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div class="modal-body" id="reset-modal-body">
          <div id="reset-form-container">
            <div class="alert alert-danger" id="reset-error" style="display: none;"></div>
            <input type="hidden" name="user_id" id="reset-user-id">
            <div class="form-group">
              <label for="new_password">New Password</label>
              <input type="password" name="new_password" class="form-control" required>
            </div>
            <div class="form-group">
              <label for="confirm_password">Confirm New Password</label>
              <input type="password" name="confirm_password" class="form-control" required>
            </div>
          </div>
          <div id="reset-success-container" style="display: none;">
            <div class="alert alert-success">Password has been reset successfully.</div>
            <div class="form-group">
              <label><strong>New Password</strong></label>
              <div class="input-group">
                <input type="text" id="new-password-field" class="form-control" readonly>
                <div class="input-group-append">
                  <button class="btn btn-outline-secondary" type="button"
                    onclick="copyToClipboard('new-password-field', this)">Copy</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
          <button type="submit" class="btn btn-primary" id="reset-submit-btn">Reset Password</button>
        </div>
      </form>
    </div>
  </div>
</div>

<!-- Delete User Modal -->
<div class="modal fade" id="deleteUserModal" tabindex="-1" role="dialog" aria-labelledby="deleteUserModalLabel"
  aria-hidden="true">
  <div class="modal-dialog" role="document">
    <div class="modal-content">
      <form id="deleteUserForm" action="<?php echo site_url('users/delete'); ?>" method="post">
        <div class="modal-header">
          <h5 class="modal-title" id="deleteUserModalLabel">Confirm Deletion</h5>
          <button type="button" class="close" data-dismiss="modal" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div class="modal-body">
          <input type="hidden" name="user_id" id="delete-user-id">
          <p>Are you sure you want to delete the user <strong id="delete-username"></strong>?</p>
          <div class="alert alert-danger">This action cannot be undone.</div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
          <button type="submit" class="btn btn-danger">Delete User</button>
        </div>
      </form>
    </div>
  </div>
</div>

<!-- Edit User Modal -->
<div class="modal fade" id="editUserModal" tabindex="-1" role="dialog" aria-labelledby="editUserModalLabel"
  aria-hidden="true">
  <div class="modal-dialog" role="document">
    <div class="modal-content">
      <form id="editUserForm" action="<?php echo site_url('users/update'); ?>" method="post">
        <div class="modal-header">
          <h5 class="modal-title" id="editUserModalLabel">Edit User: <span id="edit-username-title"></span></h5>
          <button type="button" class="close" data-dismiss="modal" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div class="modal-body">
          <div class="alert alert-danger" id="edit-error" style="display: none;"></div>
          <input type="hidden" name="user_id" id="edit-user-id">
          <div class="form-group">
            <label for="edit_username">Username</label>
            <input type="text" name="username" id="edit-username" class="form-control" required>
          </div>
          <div class="form-group">
            <label for="edit_email">Email Address (Optional)</label>
            <input type="text" name="email" id="edit-email" class="form-control">
          </div>
          <div class="form-group">
            <label for="edit_business_name">Business Name (Optional)</label>
            <input type="text" name="business_name" id="edit-business-name" class="form-control">
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
          <button type="submit" class="btn btn-primary">Save Changes</button>
        </div>
      </form>
    </div>
  </div>
</div>
