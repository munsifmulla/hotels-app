<?php

defined('BASEPATH') or exit('No direct script access allowed');

class Migration_Create_bookings_table extends CI_Migration
{

  public function up()
  {
    $this->dbforge->add_field(array(
      'id' => array(
        'type' => 'BIGINT',
        'constraint' => 20,
        'unsigned' => TRUE,
      ),
      'guest_id' => array(
        'type' => 'BIGINT',
        'constraint' => 20,
        'unsigned' => TRUE,
      ),
      'room_id' => array(
        'type' => 'BIGINT',
        'constraint' => 20,
        'unsigned' => TRUE,
      ),
      'hotel_id' => array(
        'type' => 'BIGINT',
        'constraint' => 20,
        'unsigned' => TRUE,
      ),
      'check_in_date' => array(
        'type' => 'DATETIME',
      ),
      'check_out_date' => array(
        'type' => 'DATETIME',
      ),
      'status' => array(
        'type' => 'ENUM("confirmed","checked-in","checked-out","cancelled")',
        'default' => 'confirmed',
      ),
      'total_price' => array(
        'type' => 'DECIMAL',
        'constraint' => '10,2',
      ),
      'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
      'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
    ));
    $this->dbforge->add_key('id', TRUE);
    $this->dbforge->create_table('bookings');
    $this->db->query('ALTER TABLE `bookings` ADD CONSTRAINT `fk_bookings_hotel_id` FOREIGN KEY (`hotel_id`) REFERENCES `hotels`(`id`) ON DELETE CASCADE ON UPDATE CASCADE');
    $this->db->query('ALTER TABLE `bookings` ADD CONSTRAINT `fk_bookings_guest_id` FOREIGN KEY (`guest_id`) REFERENCES `guests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE');
    $this->db->query('ALTER TABLE `bookings` ADD CONSTRAINT `fk_bookings_room_id` FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE');
  }

  public function down()
  {
    // Foreign key checks are disabled in a later migration
    $this->dbforge->drop_table('bookings', TRUE);
  }
}