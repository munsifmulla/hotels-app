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

  public function get_bookings_for_room($room_id)
  {
    return $this->db->get_where('bookings', ['room_id' => $room_id])->result_array();
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

  public function cancel_booking($booking_id)
  {
    $this->db->trans_start();

    // 1. Get the booking to find the room ID
    $booking = $this->get_booking_by_id($booking_id);
    if (!$booking) {
      $this->db->trans_rollback();
      return false;
    }

    // 2. Update the booking status to 'cancelled'
    $this->update_booking($booking_id, ['status' => 'cancelled']);

    // 3. Update the room status back to 'vacant'
    $this->db->where('id', $booking['room_id']);
    $this->db->update('rooms', ['status' => 'vacant']);

    return $this->db->trans_complete();
  }
}