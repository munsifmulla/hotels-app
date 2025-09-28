<?php

defined('BASEPATH') or exit('No direct script access allowed');

class Migration_Create_guests_table extends CI_Migration
{

  public function up()
  {
    $this->dbforge->add_field(array(
      'id' => array(
        'type' => 'BIGINT',
        'constraint' => 20,
        'unsigned' => TRUE,
      ),
      'hotel_id' => array(
        'type' => 'BIGINT',
        'constraint' => 20,
        'unsigned' => TRUE,
      ),
      'first_name' => array(
        'type' => 'VARCHAR',
        'constraint' => '100',
      ),
      'last_name' => array(
        'type' => 'VARCHAR',
        'constraint' => '100',
      ),
      'email' => array(
        'type' => 'VARCHAR',
        'constraint' => '100',
        'unique' => TRUE,
      ),
      'phone' => array(
        'type' => 'VARCHAR',
        'constraint' => '20',
      ),
      'address' => array(
        'type' => 'TEXT',
        'null' => TRUE,
      ),
    ));
    $this->dbforge->add_key('id', TRUE);
    $this->dbforge->create_table('guests');
    $this->db->query('ALTER TABLE `guests` ADD CONSTRAINT `fk_guests_hotel_id` FOREIGN KEY (`hotel_id`) REFERENCES `hotels`(`id`) ON DELETE CASCADE ON UPDATE CASCADE');
  }

  public function down()
  {
    // Foreign key checks are disabled in a later migration
    $this->dbforge->drop_table('guests', TRUE);
  }
}