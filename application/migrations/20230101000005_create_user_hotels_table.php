<?php

defined('BASEPATH') or exit('No direct script access allowed');

class Migration_Create_user_hotels_table extends CI_Migration
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
      'hotel_id' => array(
        'type' => 'BIGINT',
        'constraint' => 20,
        'unsigned' => TRUE,
      ),
    ));
    $this->dbforge->add_key('id', TRUE);
    $this->dbforge->create_table('user_hotels');
    $this->db->query('ALTER TABLE `user_hotels` ADD CONSTRAINT `fk_user_hotels_user_id` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE');
    $this->db->query('ALTER TABLE `user_hotels` ADD CONSTRAINT `fk_user_hotels_hotel_id` FOREIGN KEY (`hotel_id`) REFERENCES `hotels`(`id`) ON DELETE CASCADE ON UPDATE CASCADE');
  }

  public function down()
  {
    $this->dbforge->drop_table('user_hotels', TRUE);
  }
}