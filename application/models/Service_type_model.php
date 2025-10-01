<?php
defined('BASEPATH') or exit('No direct script access allowed');

class Service_type_model extends CI_Model
{

  public function __construct()
  {
    parent::__construct();
  }

  public function create_service_type($data)
  {
    if ($this->db->insert('service_types', $data)) {
      $insert_id = $this->db->insert_id();
      return $this->get_service_type_by_id($insert_id);
    }
    return false;
  }

  public function get_service_type_by_id($id)
  {
    return $this->db->get_where('service_types', ['id' => $id])->row_array();
  }

  public function get_service_types_for_hotel($hotel_id)
  {
    return $this->db->get_where('service_types', ['hotel_id' => $hotel_id])->result_array();
  }

  public function update_service_type($id, $data)
  {
    $this->db->where('id', $id);
    $this->db->update('service_types', $data);
    return $this->db->affected_rows() >= 0;
  }

  public function delete_service_type($id)
  {
    $this->db->where('id', $id);
    return $this->db->delete('service_types');
  }
}