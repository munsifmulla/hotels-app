<?php

defined('BASEPATH') or exit('No direct script access allowed');

class Migration_Create_invoices_table extends CI_Migration
{

  public function up()
  {
    $this->dbforge->add_field(array(
      'id' => array(
        'type' => 'BIGINT',
        'constraint' => 20,
        'unsigned' => TRUE,
      ),
      'booking_id' => array(
        'type' => 'BIGINT',
        'constraint' => 20,
        'unsigned' => TRUE,
      ),
      'invoice_number' => array(
        'type' => 'VARCHAR',
        'constraint' => '50',
        'null' => TRUE,
        'unique' => TRUE,
      ),
      'total_amount' => array(
        'type' => 'DECIMAL',
        'constraint' => '10,2',
      ),
      'discount' => array(
        'type' => 'DECIMAL',
        'constraint' => '10,2',
        'default' => '0.00',
      ),
      'final_amount' => array(
        'type' => 'DECIMAL',
        'constraint' => '10,2',
      ),
      'mode_of_payment' => array(
        'type' => 'VARCHAR',
        'constraint' => '50',
        'null' => TRUE,
      ),
      'transaction_number' => array(
        'type' => 'VARCHAR',
        'constraint' => '100',
        'null' => TRUE,
      ),
      'vat_percent' => array(
        'type' => 'DECIMAL',
        'constraint' => '5,2',
        'default' => '0.00',
      ),
      'vat_amount' => array(
        'type' => 'DECIMAL',
        'constraint' => '10,2',
        'default' => '0.00',
      ),
      'invoice_date' => array(
        'type' => 'DATETIME',
      ),
    ));
    $this->dbforge->add_key('id', TRUE);
    $this->dbforge->create_table('invoices');
    $this->db->query('ALTER TABLE `invoices` ADD CONSTRAINT `fk_invoices_booking_id` FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE');
  }

  public function down()
  {
    $this->dbforge->drop_table('invoices');
  }
}