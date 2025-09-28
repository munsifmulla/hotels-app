<?php

defined('BASEPATH') or exit('No direct script access allowed');

class Migrate extends CI_Controller
{

  public function __construct()
  {
    parent::__construct();

    // This is a security measure to ensure migrations are only run from the CLI.
    if (!$this->input->is_cli_request()) {
      show_error('You don\'t have permission to access this page.', 403);
      exit('No direct script access allowed');
    }

    $this->load->library('migration');
  }

  public function index()
  {
    if ($this->migration->latest() === FALSE) {
      show_error($this->migration->error_string());
    } else {
      echo 'Migrations ran successfully!' . PHP_EOL;
    }
  }

  public function rollback()
  {
    if ($this->migration->version(0) === FALSE) {
      show_error($this->migration->error_string());
    } else {
      echo 'All migrations rolled back successfully!' . PHP_EOL;
    }
  }
}
