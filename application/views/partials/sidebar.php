<nav class="sidebar">
  <ul class="list-unstyled components">
    <li class="<?php echo (isset($active_page) && $active_page == 'users/index') ? 'active' : ''; ?>">
      <a href="<?php echo site_url('users/index'); ?>">Users</a>
    </li>
    <!-- <li class="<?php echo (isset($active_page) && $active_page == 'users/register') ? 'active' : ''; ?>">
      <a href="<?php echo site_url('users/register'); ?>">Add User</a>
    </li> -->
    <!-- Add other navigation links here -->
  </ul>
  <div class="sidebar-footer">
    <p>emax.com</p>
  </div>
</nav>
