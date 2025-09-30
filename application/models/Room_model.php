<?php
defined('BASEPATH') or exit('No direct script access allowed');

class Room_model extends CI_Model
{

  public function __construct()
  {
    parent::__construct();
  }

  public function create_room($data)
  {
    $this->load->helper('id');
    $data['id'] = generate_unique_id();
    if ($this->db->insert('rooms', $data)) {
      return $this->get_room_by_id($data['id']);
    }
    return false;
  }

  public function get_room_by_id($room_id)
  {
    return $this->db->get_where('rooms', ['id' => $room_id])->row_array();
  }

  public function get_rooms_for_hotel($hotel_id)
  {
    return $this->db->get_where('rooms', ['hotel_id' => $hotel_id])->result_array();
  }

  public function update_room($room_id, $data)
  {
    $this->db->where('id', $room_id);
    $this->db->update('rooms', $data);
    return $this->db->affected_rows() >= 0;
  }

  public function delete_room($room_id)
  {
    $this->db->where('id', $room_id);
    return $this->db->delete('rooms');
  }

  public function is_room_number_unique($hotel_id, $room_number, $room_id = null)
  {
    $this->db->where('hotel_id', $hotel_id);
    $this->db->where('room_number', $room_number);
    if ($room_id) {
      $this->db->where('id !=', $room_id);
    }
    $query = $this->db->get('rooms');

    return $query->num_rows() === 0;
  }
}