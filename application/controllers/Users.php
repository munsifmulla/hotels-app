<?php
defined('BASEPATH') or exit('No direct script access allowed');

use \Firebase\JWT\JWT;
use \Firebase\JWT\Key;

class Users extends CI_Controller
{

  private $jwt_key;

  public function __construct()
  {
    parent::__construct();
    $this->load->model('User_model');
    $this->load->library(array('form_validation', 'session'));
    // The 'id', 'url', and 'form' helpers are now autoloaded.

    // It's best to store this key in your config file.
    // e.g., $this->config->item('jwt_key');
    $this->jwt_key = 'your_super_secret_key';
  }

  public function index()
  {
    $search = $this->input->get('search');
    $view_data['users'] = $this->User_model->get_users($search);
    $view_data['title'] = 'User Management';
    $view_data['main_content'] = 'users/index';
    $view_data['active_page'] = 'users/index';
    $view_data['search'] = $search;
    $this->load->view('layouts/main', $view_data);
  }

  public function register()
  {
    // Set validation rules
    $this->form_validation->set_rules('username', 'Username', 'trim|required|is_unique[users.username]');
    $this->form_validation->set_rules('password', 'Password', 'required|min_length[8]');
    $this->form_validation->set_rules('email', 'Email', 'trim|valid_email|is_unique[users.email]');
    $this->form_validation->set_rules('business_name', 'Business Name', 'trim');

    if ($this->form_validation->run() == FALSE) {
      // If validation fails, show the form again
      $view_data['hotels'] = $this->User_model->get_hotels();
      $view_data['title'] = 'User Registration';
      $view_data['main_content'] = 'users/register';
      $view_data['active_page'] = 'users/index'; // Keep parent menu active
      $this->load->view('layouts/main', $view_data);
    } else {
      // Validation passed, process the registration
      $email = $this->input->post('email');
      // Generate a unique ID for the user
      $id = generate_unique_id();
      $data = array(
        'id' => $id,
        'username' => $this->input->post('username'),
        'email' => empty($email) ? NULL : $email,
        'business_name' => $this->input->post('business_name'),
        'password' => $this->input->post('password'),
        'hotel_ids' => [] // No hotels selected from form anymore
      );

      if ($this->User_model->register_user($data)) {
        // On success, show the credentials page
        $success_data = [
          'username' => $data['username'],
          'password' => $data['password'], // The plain-text password from the form
        ];
        $success_data['title'] = 'Registration Successful';
        $success_data['main_content'] = 'users/register_success';
        $success_data['active_page'] = 'users/index'; // Keep parent menu active
        $this->load->view('layouts/main', $success_data);
      } else {
        // Set an error message
        $view_data['error'] = 'An error occurred during registration. Please try again.';
        $view_data['hotels'] = $this->User_model->get_hotels();
        $view_data['main_content'] = 'users/register';
        $view_data['active_page'] = 'users/index'; // Keep parent menu active
        $this->load->view('layouts/main', $view_data);
      }
    }
  }

  public function update()
  {
    $user_id = $this->input->post('user_id');

    // Set validation rules, ensuring uniqueness check ignores the current user
    $this->form_validation->set_rules('username', 'Username', 'trim|required|is_unique[users.username.id.' . $user_id . ']');
    $this->form_validation->set_rules('email', 'Email', 'trim|valid_email|is_unique[users.email.id.' . $user_id . ']');
    $this->form_validation->set_rules('business_name', 'Business Name', 'trim');

    if ($this->form_validation->run() == FALSE) {
      $this->output
        ->set_content_type('application/json')
        ->set_output(json_encode(['status' => 'error', 'message' => validation_errors()]));
    } else {
      $email = $this->input->post('email');
      $data = array(
        'username' => $this->input->post('username'),
        'email' => empty($email) ? NULL : $email,
        'business_name' => $this->input->post('business_name'),
      );

      if ($this->User_model->update_user($user_id, $data)) {
        $response = [
          'status' => 'success',
          'message' => 'User updated successfully.',
          'user' => [
            'id' => $user_id,
            'username' => $data['username'],
            'email' => $data['email'],
            'business_name' => $data['business_name']
          ]
        ];
        $this->output->set_content_type('application/json')->set_output(json_encode($response));
      } else {
        $this->output->set_content_type('application/json')->set_output(json_encode(['status' => 'error', 'message' => 'Failed to update user.']));
      }
    }
  }

  public function delete()
  {
    $user_id = $this->input->post('user_id');
    if (!$user_id) {
      $this->output
        ->set_content_type('application/json')
        ->set_output(json_encode(['status' => 'error', 'message' => 'User ID is required.']));
      return;
    }

    if ($this->User_model->delete_user($user_id)) {
      $this->output
        ->set_content_type('application/json')
        ->set_output(json_encode(['status' => 'success', 'message' => 'User deleted successfully.']));
    } else {
      $this->output
        ->set_content_type('application/json')
        ->set_output(json_encode(['status' => 'error', 'message' => 'Failed to delete user.']));
    }
  }

  public function reset_password()
  {
    $this->form_validation->set_rules('user_id', 'User ID', 'required|integer');
    $this->form_validation->set_rules('new_password', 'New Password', 'required|min_length[8]');
    $this->form_validation->set_rules('confirm_password', 'Confirm Password', 'required|matches[new_password]');

    if ($this->form_validation->run() == FALSE) {
      // If validation fails, return a JSON error response
      $this->output
        ->set_content_type('application/json')
        ->set_output(json_encode(['status' => 'error', 'message' => validation_errors()]));
    } else {
      $user_id = $this->input->post('user_id');
      $new_password = $this->input->post('new_password');

      // Fetch user details to get username for the success page
      $user = $this->db->get_where('users', ['id' => $user_id])->row();
      if ($user && $this->User_model->update_password($user_id, $new_password)) {
        // On success, return a JSON success response
        $response = [
          'status' => 'success',
          'message' => 'Password for ' . $user->username . ' has been reset successfully.',
          'new_password' => $new_password
        ];
        $this->output
          ->set_content_type('application/json')
          ->set_output(json_encode($response));
      } else {
        // If update fails, redirect back with an error
        $this->session->set_flashdata('error', 'Failed to reset password. Please try again.');
        redirect('users/index');
      }
    }
  }

  public function login()
  {
    // You can build your login page here
    echo "Login page";
  }
}