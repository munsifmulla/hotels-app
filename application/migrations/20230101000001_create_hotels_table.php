<?php

defined('BASEPATH') or exit('No direct script access allowed');

class Migration_Create_hotels_table extends CI_Migration
{

  public function up()
  {
    $this->dbforge->add_field(array(
      'id' => array(
        'type' => 'BIGINT',
        'constraint' => 20,
        'unsigned' => TRUE,
      ),
      'name' => array(
        'type' => 'VARCHAR',
        'constraint' => '255',
      ),
      'address' => array(
        'type' => 'TEXT',
      ),
      'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
    ));
    $this->dbforge->add_key('id', TRUE);
    $this->dbforge->create_table('hotels');
  }

  public function down()
  {
    // Foreign key checks are disabled in a later migration
    $this->dbforge->drop_table('hotels', TRUE);
  }
}