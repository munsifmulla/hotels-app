<?php
defined('BASEPATH') or exit('No direct script access allowed');

class Guest_model extends CI_Model
{

  public function __construct()
  {
    parent::__construct();
  }

  public function create_guest($data)
  {
    $this->load->helper('id');
    $data['id'] = generate_unique_id();
    if ($this->db->insert('guests', $data)) {
      return $this->get_guest_by_id($data['id']);
    }
    return false;
  }

  public function get_guest_by_id($guest_id)
  {
    return $this->db->get_where('guests', ['id' => $guest_id])->row_array();
  }

  public function get_guests_for_hotel($hotel_id)
  {
    return $this->db->get_where('guests', ['hotel_id' => $hotel_id])->result_array();
  }

  public function update_guest($guest_id, $data)
  {
    $this->db->where('id', $guest_id);
    $this->db->update('guests', $data);
    return $this->db->affected_rows() >= 0;
  }

  public function delete_guest($guest_id)
  {
    $this->db->where('id', $guest_id);
    return $this->db->delete('guests');
  }

  public function search_guests($hotel_id, $search_term)
  {
    $this->db->where('hotel_id', $hotel_id);
    $this->db->group_start();
    $this->db->like('phone', $search_term);
    $this->db->or_like('govt_id', $search_term);
    $this->db->group_end();
    return $this->db->get('guests')->result_array();
  }

  /**
   * Checks if an email is unique for a given hotel, optionally excluding a specific guest.
   * This is useful because a guest's email should be unique per hotel, but the same person
   * could be a guest at multiple hotels in the system.
   */
  public function is_email_unique_for_hotel($hotel_id, $email, $guest_id = null)
  {
    $this->db->where('hotel_id', $hotel_id);
    $this->db->where('email', $email);
    if ($guest_id) {
      $this->db->where('id !=', $guest_id);
    }
    $query = $this->db->get('guests');

    return $query->num_rows() === 0;
  }
}