<?php

defined('BASEPATH') or exit('No direct script access allowed');

class Migration_Add_business_name_to_users extends CI_Migration
{

  public function up()
  {
    $fields = array(
      'business_name' => array(
        'type' => 'VARCHAR',
        'constraint' => '255',
        'null' => TRUE,
        'after' => 'email'
      )
    );
    $this->dbforge->add_column('users', $fields);
  }

  public function down()
  {
    $this->dbforge->drop_column('users', 'business_name');
  }
}