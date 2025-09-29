<div class="mb-3">
  <a href="<?php echo site_url('users/index'); ?>">&laquo; Back to User List</a>
</div>

<div class="card">
  <div class="card-header d-flex justify-content-between align-items-center">
    <h2>Manage Hotels for: <strong><?php echo html_escape($user['username']); ?></strong></h2>
    <button class="btn btn-primary" data-toggle="modal" data-target="#addHotelModal">
      <i class="fa fa-plus"></i> Add Hotel to User
    </button>
  </div>
  <div class="card-body">
    <p>The following hotels are assigned to this user.</p>
    <table class="table table-striped">
      <thead>
        <tr>
          <th>Hotel Name</th>
          <th style="width: 150px;">Actions</th>
        </tr>
      </thead>
      <tbody>
        <?php if (!empty($assigned_hotels)): ?>
          <?php foreach ($assigned_hotels as $hotel): ?>
            <tr id="hotel-row-<?php echo $hotel['id']; ?>">
              <td id="hotel-name-<?php echo $hotel['id']; ?>"><?php echo html_escape($hotel['name']); ?></td>
              <td>
                <button class="btn btn-sm btn-info" data-toggle="modal" data-target="#editHotelModal"
                  data-hotel-id="<?php echo $hotel['id']; ?>"
                  data-hotel-name="<?php echo html_escape($hotel['name']); ?>"
                  data-hotel-address="<?php echo html_escape($hotel['address']); ?>">Edit</button>
                <button class="btn btn-sm btn-danger" data-toggle="modal" data-target="#removeHotelModal"
                  data-user-id="<?php echo $user['id']; ?>" data-hotel-id="<?php echo $hotel['id']; ?>"
                  data-hotel-name="<?php echo html_escape($hotel['name']); ?>">Remove</button>
              </td>
            </tr>
          <?php endforeach; ?>
        <?php else: ?>
          <tr>
            <td colspan="2" class="text-center">No hotels assigned to this user yet.</td>
          </tr>
        <?php endif; ?>
      </tbody>
    </table>
  </div>
</div>

<!-- Add Hotel Modal -->
<div class="modal fade" id="addHotelModal" tabindex="-1" role="dialog" aria-labelledby="addHotelModalLabel"
  aria-hidden="true">
  <div class="modal-dialog" role="document">
    <div class="modal-content">
      <form id="addHotelForm" action="<?php echo site_url('users/create_hotel_for_user'); ?>" method="post">
        <div class="modal-header">
          <h5 class="modal-title" id="addHotelModalLabel">Add Hotel to <?php echo html_escape($user['username']); ?>
          </h5>
          <button type="button" class="close" data-dismiss="modal" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div class="modal-body">
          <div class="alert alert-danger" id="add-hotel-error" style="display: none;"></div>
          <input type="hidden" name="user_id" value="<?php echo $user['id']; ?>">
          <div class="form-group">
            <label for="hotel_name">New Hotel Name</label>
            <input type="text" name="hotel_name" id="hotel_name" class="form-control" required>
          </div>
          <div class="form-group">
            <label for="hotel_address">Address (Optional)</label>
            <textarea name="address" id="hotel_address" class="form-control" rows="3"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
          <button type="submit" class="btn btn-primary">Add Hotel</button>
        </div>
      </form>
    </div>
  </div>
</div>

<!-- Edit Hotel Modal -->
<div class="modal fade" id="editHotelModal" tabindex="-1" role="dialog" aria-labelledby="editHotelModalLabel"
  aria-hidden="true">
  <div class="modal-dialog" role="document">
    <div class="modal-content">
      <form id="editHotelForm" action="<?php echo site_url('users/update_hotel'); ?>" method="post">
        <div class="modal-header">
          <h5 class="modal-title" id="editHotelModalLabel">Edit Hotel</h5>
          <button type="button" class="close" data-dismiss="modal" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div class="modal-body">
          <div class="alert alert-danger" id="edit-hotel-error" style="display: none;"></div>
          <input type="hidden" name="hotel_id" id="edit-hotel-id">
          <div class="form-group">
            <label for="edit-hotel-name">Hotel Name</label>
            <input type="text" name="name" id="edit-hotel-name" class="form-control" required>
          </div>
          <div class="form-group">
            <label for="edit-hotel-address">Address</label>
            <textarea name="address" id="edit-hotel-address" class="form-control" rows="3"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Changes</button>
        </div>
      </form>
    </div>
  </div>
</div>

<!-- Remove Hotel Modal -->
<div class="modal fade" id="removeHotelModal" tabindex="-1" role="dialog" aria-labelledby="removeHotelModalLabel"
  aria-hidden="true">
  <div class="modal-dialog" role="document">
    <div class="modal-content">
      <form id="removeHotelForm" action="<?php echo site_url('users/remove_hotel_from_user'); ?>" method="post">
        <div class="modal-header">
          <h5 class="modal-title" id="removeHotelModalLabel">Confirm Removal</h5>
          <button type="button" class="close" data-dismiss="modal" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div class="modal-body">
          <input type="hidden" name="user_id" id="remove-user-id">
          <input type="hidden" name="hotel_id" id="remove-hotel-id">
          <p>Are you sure you want to remove <strong id="remove-hotel-name"></strong> from this user?</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
          <button type="submit" class="btn btn-danger">Remove</button>
        </div>
      </form>
    </div>
  </div>
</div>
