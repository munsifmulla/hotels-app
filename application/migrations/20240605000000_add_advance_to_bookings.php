<?php

defined('BASEPATH') or exit('No direct script access allowed');

class Migration_Add_advance_to_bookings extends CI_Migration
{

  public function up()
  {
    $fields = array(
      'advance_amount' => array(
        'type' => 'DECIMAL',
        'constraint' => '10,2',
        'default' => '0.00',
        'after' => 'total_price'
      )
    );
    $this->dbforge->add_column('bookings', $fields);
  }

  public function down()
  {
    $this->dbforge->drop_column('bookings', 'advance_amount');
  }
}