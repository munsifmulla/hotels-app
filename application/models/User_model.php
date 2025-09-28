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
    $this->db->select('id, username, email, business_name');
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
      'business_name' => $data['business_name']
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