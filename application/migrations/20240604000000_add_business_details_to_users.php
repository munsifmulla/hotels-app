<?php

defined('BASEPATH') or exit('No direct script access allowed');

class Migration_Add_business_details_to_users extends CI_Migration
{

  public function up()
  {
    $fields = array(
      'business_address' => array(
        'type' => 'TEXT',
        'null' => TRUE,
        'after' => 'business_name_lang'
      ),
      'phone_number' => array(
        'type' => 'VARCHAR',
        'constraint' => '50',
        'null' => TRUE,
        'after' => 'business_address'
      )
    );
    $this->dbforge->add_column('users', $fields);
  }

  public function down()
  {
    $this->dbforge->drop_column('users', 'business_address');
    $this->dbforge->drop_column('users', 'phone_number');
  }
}