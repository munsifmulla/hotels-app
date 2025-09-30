<?php

defined('BASEPATH') or exit('No direct script access allowed');

class Migration_Add_govtid_to_guests_table extends CI_Migration
{

  public function up()
  {
    $fields = array(
      'govt_id_number' => array(
        'type' => 'VARCHAR',
        'constraint' => '100',
        'null' => TRUE,
      ),
    );
    $this->dbforge->add_column('guests', $fields);
  }

  public function down()
  {
    $this->dbforge->drop_column('guests', 'govt_id_number');
  }
}