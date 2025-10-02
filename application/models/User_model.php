<?php
defined('BASEPATH') or exit('No direct script access allowed');

use \Firebase\JWT\JWT;
use \Firebase\JWT\Key;

class User_model extends CI_Model
{

  public function __construct()
  {
    parent::__construct();
    // You can load the database library here if it's not autoloaded
    // $this->load->database();
  }

  public function get_hotels()
  {
    $query = $this->db->get('hotels');
    return $query->result_array();
  }

  public function get_users($search = NULL)
  {
    $this->db->select('id, username, email, business_name, business_name_lang, trn_number, business_address, phone_number');
    if ($search) {
      $this->db->group_start();
      $this->db->like('username', $search);
      $this->db->or_like('business_name', $search);
      $this->db->group_end();
    }
    $this->db->from('users');
    $query = $this->db->get();
    return $query->result_array();
  }

  public function get_user_by_id($user_id)
  {
    $this->db->where('id', $user_id);
    $query = $this->db->get('users');
    return $query->row_array();
  }

  public function get_hotels_for_user($user_id)
  {
    $this->db->select('h.id, h.name, h.address');
    $this->db->from('hotels h');
    $this->db->join('user_hotels uh', 'uh.hotel_id = h.id');
    $this->db->where('uh.user_id', $user_id);
    $query = $this->db->get();
    return $query->result_array();
  }

  public function add_hotel_to_user($user_id, $hotel_id)
  {
    $this->load->helper('id'); // Ensure ID helper is loaded
    $user_hotel_id = generate_unique_id();
    return $this->db->insert('user_hotels', ['id' => $user_hotel_id, 'user_id' => $user_id, 'hotel_id' => $hotel_id]);
  }

  public function create_and_assign_hotel($user_id, $hotel_name, $address = NULL)
  {
    $this->load->helper('id'); // Ensure ID helper is loaded

    $this->db->trans_start();

    // 1. Create the new hotel
    $hotel_id = generate_unique_id();
    $hotel_data = [
      'id' => $hotel_id,
      'name' => $hotel_name,
      'address' => $address
    ];
    $this->db->insert('hotels', $hotel_data);

    // 2. Assign the new hotel to the user
    $this->add_hotel_to_user($user_id, $hotel_id);

    $this->db->trans_complete();

    if ($this->db->trans_status() === FALSE) {
      return false;
    }
    return ['id' => $hotel_id, 'name' => $hotel_name];
  }

  public function register_user($data)
  {
    // We use a transaction to ensure all or nothing is inserted.
    $this->db->trans_start();

    // 1. Insert the new user
    $user_data = array(
      'id' => $data['id'],
      'username' => $data['username'],
      'email' => $data['email'],
      'password' => password_hash($data['password'], PASSWORD_DEFAULT),
      'business_name' => $data['business_name'],
      'business_name_lang' => isset($data['business_name_lang']) ? $data['business_name_lang'] : null,
      'trn_number' => $data['trn_number'],
      'business_address' => isset($data['business_address']) ? $data['business_address'] : null,
      'phone_number' => isset($data['phone_number']) ? $data['phone_number'] : null
    );
    $this->db->insert('users', $user_data);
    $user_id = $data['id']; // Use the ID we generated in the controller

    // 2. Link user to the selected hotels
    if (!empty($data['hotel_ids'])) {
      foreach ($data['hotel_ids'] as $hotel_id) {
        $user_hotel_data = array(
          'user_id' => $user_id,
          'hotel_id' => $hotel_id
        );
        $this->db->insert('user_hotels', $user_hotel_data);
      }
    }

    $this->db->trans_complete();

    // Check if the transaction was successful
    return $this->db->trans_status();
  }

  public function update_password($user_id, $new_password)
  {
    $hashed_password = password_hash($new_password, PASSWORD_DEFAULT);

    $this->db->where('id', $user_id);
    $this->db->update('users', ['password' => $hashed_password]);

    return $this->db->affected_rows() > 0;
  }

  public function update_user($user_id, $data)
  {
    $this->db->where('id', $user_id);
    $this->db->update('users', $data);

    return $this->db->affected_rows() >= 0; // Return true if update is successful or no changes were made
  }

  public function delete_user($user_id)
  {
    $this->db->where('id', $user_id);
    $this->db->delete('users');

    return $this->db->affected_rows() > 0;
  }
}