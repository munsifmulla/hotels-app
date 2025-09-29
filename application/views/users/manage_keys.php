<div class="mb-3">
  <a href="<?php echo site_url('users/index'); ?>">&laquo; Back to User List</a>
</div>

<div class="card">
  <div class="card-header d-flex justify-content-between align-items-center">
    <h2>Manage API Keys for: <strong><?php echo html_escape($user['username']); ?></strong></h2>
    <button class="btn btn-primary" data-toggle="modal" data-target="#createKeyModal" <?php echo !empty($existing_keys) ? 'disabled' : ''; ?>>
      <i class="fa fa-plus"></i> Create New Key
    </button>
  </div>
  <div class="card-body">
    <p>The following API keys are assigned to this user.</p>
    <table class="table table-striped">
      <thead>
        <tr>
          <th>Key</th>
          <th>Start Date</th>
          <th>End Date</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <?php if (!empty($existing_keys)): ?>
          <?php foreach ($existing_keys as $key): ?>
            <tr>
              <td>
                <code>
                              <?php
                              echo html_escape(substr($key['encrypted_id'], 0, 25)) . (strlen($key['encrypted_id']) > 25 ? '...' : '');
                              ?>
                            </code>
                <button class="btn btn-link btn-sm p-0 ml-2"
                  onclick="copyKeyToClipboard('<?php echo html_escape($key['encrypted_id']); ?>', this)"
                  title="Copy API Key to clipboard">
                  <i class="fa fa-copy"></i>
                </button>
              </td>
              <td><?php echo date('Y-m-d', strtotime($key['start_date'])); ?></td>
              <td><?php echo date('Y-m-d', strtotime($key['end_date'])); ?></td>
              <td>
                <?php
                $status_class = 'secondary';
                if ($key['status'] === 'active')
                  $status_class = 'success';
                if ($key['status'] === 'generated')
                  $status_class = 'info';
                ?>
                <span class="badge badge-<?php echo $status_class; ?>"><?php echo ucfirst($key['status']); ?></span>
              </td>
              <td>
                <button class="btn btn-sm btn-danger" data-toggle="modal" data-target="#deleteKeyModal"
                  data-key-id="<?php echo html_escape($key['encrypted_id']); ?>"
                  data-key-display-id="<?php echo html_escape(substr($key['encrypted_id'], 0, 25)) . (strlen($key['encrypted_id']) > 25 ? '...' : ''); ?>">Delete</button>
              </td>
            </tr>
          <?php endforeach; ?>
        <?php else: ?>
          <tr>
            <td colspan="5" class="text-center">No API keys found for this user.</td>
          </tr>
        <?php endif; ?>
      </tbody>
    </table>
  </div>
</div>

<!-- Create Key Modal -->
<div class="modal fade" id="createKeyModal" tabindex="-1" role="dialog" aria-labelledby="createKeyModalLabel"
  aria-hidden="true">
  <div class="modal-dialog modal-lg" role="document">
    <div class="modal-content">
      <form id="createKeyForm" action="<?php echo site_url('users/create_key'); ?>" method="post">
        <div class="modal-header">
          <h5 class="modal-title" id="createKeyModalLabel">Create New API Key</h5>
          <button type="button" class="close" data-dismiss="modal" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div class="modal-body">
          <div class="alert alert-danger" id="create-key-error" style="display: none;"></div>
          <div id="key-success-container" style="display: none;">
            <div class="alert alert-success">API Key created successfully! Please copy it now, you won't be able to see
              it again.</div>
            <div class="form-group">
              <label for="new-key-id-field"><strong>New Key ID</strong></label>
              <div class="input-group">
                <input type="text" id="new-key-id-field" class="form-control" readonly>
                <div class="input-group-append">
                  <button class="btn btn-outline-secondary" type="button" id="copy-new-key-id-btn">Copy</button>
                </div>
              </div>
              <small class="form-text text-muted">The page will reload when you close this window.</small>
            </div>
          </div>
          <div id="key-form-container">
            <input type="hidden" name="user_id" value="<?php echo $user['id']; ?>">
            <div class="row">
              <div class="col-md-6">
                <div class="form-group">
                  <label for="start_date">Start Date</label>
                  <input type="date" name="start_date" class="form-control" required>
                </div>
              </div>
              <div class="col-md-6">
                <div class="form-group">
                  <label for="end_date">End Date</label>
                  <input type="date" name="end_date" class="form-control" required>
                </div>
              </div>
            </div>
            <div class="form-group">
              <label for="hotel_ids">Select Hotels for this Key</label>
              <select name="hotel_ids[]" id="hotel_ids" class="form-control" multiple required size="5">
                <?php foreach ($assigned_hotels as $hotel): ?>
                  <option value="<?php echo $hotel['id']; ?>"><?php echo html_escape($hotel['name']); ?></option>
                <?php endforeach; ?>
              </select>
              <small class="form-text text-muted">Hold Ctrl (or Cmd on Mac) to select multiple hotels.</small>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
          <button type="submit" class="btn btn-primary" id="create-key-submit-btn">Create Key</button>
        </div>
      </form>
    </div>
  </div>
</div>

<!-- Delete Key Modal -->
<div class="modal fade" id="deleteKeyModal" tabindex="-1" role="dialog" aria-labelledby="deleteKeyModalLabel"
  aria-hidden="true">
  <div class="modal-dialog" role="document">
    <div class="modal-content">
      <form id="deleteKeyForm" action="<?php echo site_url('users/delete_key'); ?>" method="post">
        <div class="modal-header">
          <h5 class="modal-title" id="deleteKeyModalLabel">Confirm Deletion</h5>
          <button type="button" class="close" data-dismiss="modal" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div class="modal-body">
          <input type="hidden" name="key_id" id="delete-key-id">
          <p>Are you sure you want to permanently delete this API key?</p>
          <p>Key: <code id="delete-key-display-id"></code></p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
          <button type="submit" class="btn btn-danger">Delete Key</button>
        </div>
      </form>
    </div>
  </div>
</div>
