<?php

defined('BASEPATH') or exit('No direct script access allowed');

class Migration_Create_rooms_tables extends CI_Migration
{

  public function up()
  {
    // Room Types Table
    $this->dbforge->add_field(array(
      'id' => array(
        'type' => 'BIGINT',
        'constraint' => 10,
        'unsigned' => TRUE,
      ),
      'hotel_id' => array(
        'type' => 'BIGINT',
        'constraint' => 10,
        'unsigned' => TRUE,
      ),
      'name' => array(
        'type' => 'VARCHAR',
        'constraint' => '100',
      ),
      'description' => array(
        'type' => 'TEXT',
        'null' => TRUE,
      ),
    ));
    $this->dbforge->add_key('id', TRUE);
    $this->dbforge->create_table('room_types');
    $this->db->query('ALTER TABLE `room_types` ADD CONSTRAINT `fk_room_types_hotel_id` FOREIGN KEY (`hotel_id`) REFERENCES `hotels`(`id`) ON DELETE CASCADE ON UPDATE CASCADE');
    // Rooms Table
    $this->dbforge->add_field(array(
      'id' => array(
        'type' => 'BIGINT',
        'constraint' => 20,
        'unsigned' => TRUE,
      ),
      'room_number' => array(
        'type' => 'VARCHAR',
        'constraint' => '20',
      ),
      'room_type_id' => array(
        'type' => 'BIGINT',
        'constraint' => 20,
        'unsigned' => TRUE,
      ),
      'hotel_id' => array(
        'type' => 'BIGINT',
        'constraint' => 20,
        'unsigned' => TRUE,
      ),
      'status' => array(
        'type' => 'ENUM("vacant","occupied","maintenance")',
        'default' => 'vacant',
      ),
      'price_per_night' => array(
        'type' => 'DECIMAL',
        'constraint' => '10,2',
      ),
      'number_of_beds' => array(
        'type' => 'INT',
        'constraint' => 5,
        'default' => 1,
      ),
      'number_of_bathrooms' => array(
        'type' => 'INT',
        'constraint' => 5,
        'default' => 1,
      ),
      'has_tv' => array(
        'type' => 'TINYINT',
        'constraint' => 1,
        'default' => 0,
      ),
      'has_kitchen' => array(
        'type' => 'TINYINT',
        'constraint' => 1,
        'default' => 0,
      ),
      'has_fridge' => array(
        'type' => 'TINYINT',
        'constraint' => 1,
        'default' => 0,
      ),
      'has_ac' => array(
        'type' => 'TINYINT',
        'constraint' => 1,
        'default' => 0,
      ),
    ));
    $this->dbforge->add_key('id', TRUE);
    $this->dbforge->create_table('rooms');
    $this->db->query('ALTER TABLE `rooms` ADD CONSTRAINT `fk_rooms_hotel_id` FOREIGN KEY (`hotel_id`) REFERENCES `hotels`(`id`) ON DELETE CASCADE ON UPDATE CASCADE');
    $this->db->query('ALTER TABLE `rooms` ADD CONSTRAINT `fk_rooms_room_type_id` FOREIGN KEY (`room_type_id`) REFERENCES `room_types`(`id`) ON DELETE CASCADE ON UPDATE CASCADE');
    $this->db->query('ALTER TABLE `rooms` ADD UNIQUE INDEX `unique_room_per_hotel` (`hotel_id`, `room_number`)');
  }

  public function down()
  {
    // Foreign key checks are disabled in a later migration
    $this->dbforge->drop_table('rooms', TRUE);
    $this->dbforge->drop_table('room_types', TRUE);
  }
}