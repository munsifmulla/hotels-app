<?php
defined('BASEPATH') or exit('No direct script access allowed');

class Invoice_model extends CI_Model
{

  public function __construct()
  {
    parent::__construct();
  }

  public function create_invoice($data)
  {
    $this->load->helper('id');
    $data['id'] = generate_unique_id();
    if ($this->db->insert('invoices', $data)) {
      return $this->get_invoice_by_id($data['id']);
    }
    return false;
  }

  public function get_invoice_by_id($invoice_id)
  {
    return $this->db->get_where('invoices', ['id' => $invoice_id])->row_array();
  }

  public function get_invoice_by_booking_id($booking_id)
  {
    return $this->db->get_where('invoices', ['booking_id' => $booking_id])->row_array();
  }

  public function get_invoices_for_hotel($hotel_id)
  {
    $this->db->select('i.*');
    $this->db->from('invoices i');
    $this->db->join('bookings b', 'b.id = i.booking_id');
    $this->db->where('b.hotel_id', $hotel_id);
    return $this->db->get()->result_array();
  }

  public function update_invoice($invoice_id, $data)
  {
    $this->db->where('id', $invoice_id);
    $this->db->update('invoices', $data);
    return $this->db->affected_rows() >= 0;
  }

  public function delete_invoice($invoice_id)
  {
    $this->db->where('id', $invoice_id);
    return $this->db->delete('invoices');
  }

  public function get_last_invoice_for_user($prefix, $user_id)
  {
    $this->db->select('i.invoice_number');
    $this->db->from('invoices i');
    $this->db->join('bookings b', 'i.booking_id = b.id');
    $this->db->join('user_hotels uh', 'b.hotel_id = uh.hotel_id');
    $this->db->where('uh.user_id', $user_id);
    $this->db->like('i.invoice_number', $prefix . '-', 'after');
    $this->db->order_by('i.id', 'DESC'); // Order by creation time
    $this->db->limit(1);
    return $this->db->get()->row_array();
  }
}