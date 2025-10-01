<?php
defined('BASEPATH') or exit('No direct script access allowed');

class Service_model extends CI_Model
{

  public function __construct()
  {
    parent::__construct();
  }

  public function add_service($data)
  {
    // The 'id' is auto-incrementing, so we don't need to generate it.
    if ($this->db->insert('services', $data)) {
      $insert_id = $this->db->insert_id();
      return $this->get_service_by_id($insert_id);
    }
    return false;
  }

  public function get_service_by_id($service_id)
  {
    return $this->db->get_where('services', ['id' => $service_id])->row_array();
  }

  public function delete_service($service_id)
  {
    $this->db->where('id', $service_id);
    return $this->db->delete('services');
  }

  public function get_services_for_hotel($hotel_id)
  {
    return $this->db->get_where('services', ['hotel_id' => $hotel_id])->result_array();
  }

  public function update_service($service_id, $data)
  {
    $this->db->where('id', $service_id);
    $this->db->update('services', $data);
    return $this->db->affected_rows() >= 0;
  }
}