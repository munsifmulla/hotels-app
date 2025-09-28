<?php

defined('BASEPATH') or exit('No direct script access allowed');

class Migration_Create_subscription_keys_table extends CI_Migration
{

  public function up()
  {
    $this->dbforge->add_field(array(
      'id' => array(
        'type' => 'BIGINT',
        'constraint' => 20,
        'unsigned' => TRUE,
      ),
      'user_id' => array(
        'type' => 'BIGINT',
        'constraint' => 20,
        'unsigned' => TRUE,
      ),
      'token' => array(
        'type' => 'TEXT',
      ),
      'start_date' => array(
        'type' => 'DATE',
      ),
      'end_date' => array(
        'type' => 'DATE',
      ),
      'status' => array(
        'type' => "ENUM('generated','active','expired','cancelled')",
        'default' => 'generated',
      ),
      'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
      'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
    ));
    $this->dbforge->add_key('id', TRUE);
    $this->dbforge->create_table('subscription_keys');
    $this->db->query('ALTER TABLE `subscription_keys` ADD CONSTRAINT `fk_subscription_keys_user_id` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE');
  }

  public function down()
  {
    $this->db->query('SET FOREIGN_KEY_CHECKS=0;');
    // Drop tables in reverse order of creation
    $this->dbforge->drop_table('subscription_keys', TRUE);
  }
}