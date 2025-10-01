<?php

defined('BASEPATH') or exit('No direct script access allowed');

class Migration_Add_trn_to_users extends CI_Migration
{

  public function up()
  {
    // Add the new trn_number column
    $trn_field = array(
      'trn_number' => array(
        'type' => 'VARCHAR',
        'constraint' => '100',
        'null' => FALSE,
        'after' => 'business_name'
      )
    );
    $this->dbforge->add_column('users', $trn_field);

    // Modify the business_name column to be NOT NULL
    $business_name_field = array(
      'business_name' => array(
        'name' => 'business_name',
        'type' => 'VARCHAR',
        'constraint' => '255',
        'null' => FALSE,
      )
    );
    $this->dbforge->modify_column('users', $business_name_field);
  }

  public function down()
  {
    $this->dbforge->drop_column('users', 'trn_number');
    // You might want to revert business_name to allow NULLs here if needed
  }
}