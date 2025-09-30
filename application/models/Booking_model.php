<?php
defined('BASEPATH') or exit('No direct script access allowed');

class Booking_model extends CI_Model
{

  public function __construct()
  {
    parent::__construct();
  }

  public function create_booking($data)
  {
    $this->db->trans_start();

    // 1. Create the booking
    $this->load->helper('id');
    $data['id'] = generate_unique_id();
    $this->db->insert('bookings', $data);
    $booking_id = $data['id'];

    // 2. Update the room status to 'occupied'
    $room_id = $data['room_id'];
    $this->db->where('id', $room_id);
    $this->db->update('rooms', ['status' => 'occupied']);

    $this->db->trans_complete();

    if ($this->db->trans_status() === FALSE) {
      return false;
    }
    return $this->get_booking_by_id($booking_id);
  }

  public function get_booking_by_id($booking_id)
  {
    return $this->db->get_where('bookings', ['id' => $booking_id])->row_array();
  }

  public function get_bookings_for_hotel($hotel_id)
  {
    return $this->db->get_where('bookings', ['hotel_id' => $hotel_id])->result_array();
  }

  public function update_booking($booking_id, $data)
  {
    $this->db->where('id', $booking_id);
    return $this->db->update('bookings', $data);
  }

  public function delete_booking($booking_id)
  {
    $this->db->where('id', $booking_id);
    return $this->db->delete('bookings');
  }
}