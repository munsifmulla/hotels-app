<?php
defined('BASEPATH') or exit('No direct script access allowed');

class Room_type_model extends CI_Model
{

  public function __construct()
  {
    parent::__construct();
  }

  public function get_room_types_for_hotel($hotel_id)
  {
    return $this->db->get_where('room_types', ['hotel_id' => $hotel_id])->result_array();
  }

  public function get_room_type_by_id($room_type_id)
  {
    return $this->db->get_where('room_types', ['id' => $room_type_id])->row_array();
  }

  public function create_room_type($data)
  {
    $this->load->helper('id');
    $data['id'] = generate_unique_id();
    if ($this->db->insert('room_types', $data)) {
      return $this->get_room_type_by_id($data['id']);
    }
    return false;
  }

  public function update_room_type($room_type_id, $data)
  {
    $this->db->where('id', $room_type_id);
    $this->db->update('room_types', $data);
    return $this->db->affected_rows() >= 0;
  }

  public function delete_room_type($room_type_id)
  {
    $this->db->where('id', $room_type_id);
    return $this->db->delete('room_types');
  }

  public function is_name_unique($hotel_id, $name, $room_type_id = null)
  {
    $this->db->where('hotel_id', $hotel_id);
    $this->db->where('name', $name);
    if ($room_type_id) {
      $this->db->where('id !=', $room_type_id);
    }
    $query = $this->db->get('room_types');

    return $query->num_rows() === 0;
  }
}