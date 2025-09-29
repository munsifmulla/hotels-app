<?php
defined('BASEPATH') or exit('No direct script access allowed');

class Key_model extends CI_Model
{

  public function __construct()
  {
    parent::__construct();
  }

  public function create_key($data)
  {
    $this->load->helper('id');
    $key_id = generate_unique_id();
    $data['id'] = $key_id;

    if ($this->db->insert('subscription_keys', $data)) {
      return $key_id;
    }
    return false;
  }

  public function get_keys_for_user($user_id)
  {
    return $this->db->get_where('subscription_keys', ['user_id' => $user_id])->result_array();
  }

  public function get_key_by_id($key_id)
  {
    return $this->db->get_where('subscription_keys', ['id' => $key_id])->row_array();
  }

  public function delete_key($key_id)
  {
    $this->db->trans_start();

    $this->db->where('id', $key_id);
    $this->db->delete('subscription_keys');

    $this->db->trans_complete();
    return $this->db->trans_status();
  }

  public function update_key($key_id, $data)
  {
    $this->db->where('id', $key_id);
    $this->db->update('subscription_keys', $data);
    return $this->db->affected_rows() >= 0;
  }
}