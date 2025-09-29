<?php
defined('BASEPATH') or exit('No direct script access allowed');

class Hotel_model extends CI_Model
{

  public function __construct()
  {
    parent::__construct();
  }

  public function update_hotel($hotel_id, $data)
  {
    $this->db->where('id', $hotel_id);
    $this->db->update('hotels', $data);
    return $this->db->affected_rows() >= 0;
  }

  public function remove_hotel_from_user($user_id, $hotel_id)
  {
    $this->db->where('user_id', $user_id);
    $this->db->where('hotel_id', $hotel_id);
    $this->db->delete('user_hotels');
    return $this->db->affected_rows() > 0;
  }

  public function get_hotel_by_id($hotel_id)
  {
    return $this->db->get_where('hotels', ['id' => $hotel_id])->row_array();
  }
}