<?php

defined('BASEPATH') or exit('No direct script access allowed');

class Migration_Create_service_types_table extends CI_Migration
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
      'hotel_id' => array(
        'type' => 'BIGINT',
        'constraint' => 20,
        'unsigned' => TRUE,
      ),
      'service' => array(
        'type' => 'VARCHAR',
        'constraint' => '255',
      ),
      'price' => array(
        'type' => 'DECIMAL',
        'constraint' => '10,2',
      ),
    ));
    $this->dbforge->add_key('id', TRUE);
    $this->dbforge->create_table('service_types');
    $this->db->query('ALTER TABLE `service_types` ADD CONSTRAINT `fk_service_types_hotel_id` FOREIGN KEY (`hotel_id`) REFERENCES `hotels`(`id`) ON DELETE CASCADE ON UPDATE CASCADE');
  }

  public function down()
  {
    $this->dbforge->drop_table('service_types');
  }
}