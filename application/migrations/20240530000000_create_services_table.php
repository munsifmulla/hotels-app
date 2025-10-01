<?php

defined('BASEPATH') or exit('No direct script access allowed');

class Migration_Create_services_table extends CI_Migration
{

  public function up()
  {
    $this->dbforge->add_field(array(
      'id' => array(
        'type' => 'BIGINT',
        'constraint' => 20,
        'unsigned' => TRUE,
        'auto_increment' => TRUE
      ),
      'booking_id' => array(
        'type' => 'BIGINT',
        'constraint' => 20,
        'unsigned' => TRUE,
      ),
      'hotel_id' => array(
        'type' => 'BIGINT',
        'constraint' => 20,
        'unsigned' => TRUE,
      ),
      'service_id' => array(
        'type' => 'BIGINT',
        'constraint' => 20,
        'unsigned' => TRUE,
      ),
    ));
    $this->dbforge->add_key('id', TRUE);
    $this->dbforge->create_table('services');
    $this->db->query('ALTER TABLE `services` ADD CONSTRAINT `fk_services_booking_id` FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE');
    $this->db->query('ALTER TABLE `services` ADD CONSTRAINT `fk_services_hotel_id` FOREIGN KEY (`hotel_id`) REFERENCES `hotels`(`id`) ON DELETE CASCADE ON UPDATE CASCADE');
    $this->db->query('ALTER TABLE `services` ADD CONSTRAINT `fk_services_service_id` FOREIGN KEY (`service_id`) REFERENCES `service_types`(`id`) ON DELETE CASCADE ON UPDATE CASCADE');
  }

  public function down()
  {
    $this->dbforge->drop_table('services');
  }
}