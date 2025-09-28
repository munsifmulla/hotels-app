<?php

defined('BASEPATH') or exit('No direct script access allowed');

class Migration_Create_users_table extends CI_Migration
{

  public function up()
  {
    $this->dbforge->add_field(array(
      'id' => array(
        'type' => 'BIGINT',
        'constraint' => 20, // This will be treated as BIGINT by the change below
        'unsigned' => TRUE,
      ),
      'username' => array(
        'type' => 'VARCHAR',
        'constraint' => '80',
        'unique' => TRUE,
      ),
      'password' => array(
        'type' => 'VARCHAR',
        'constraint' => '255',
      ),
      'email' => array(
        'type' => 'VARCHAR',
        'constraint' => '100',
        'unique' => TRUE,
        'null' => TRUE,
      ),
      'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
      'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
    ));
    $this->dbforge->add_key('id', TRUE);
    $this->dbforge->create_table('users');
  }

  public function down()
  {
    $this->dbforge->drop_table('users', TRUE);
    // Re-enable foreign key checks after all tables are dropped.
    $this->db->query('SET FOREIGN_KEY_CHECKS=1;');
  }
}