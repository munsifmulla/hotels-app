<?php
defined('BASEPATH') or exit('No direct script access allowed');

// Manually load the JWT library files since Composer is not used.
require_once APPPATH . 'third_party/php-jwt/JWT.php';
require_once APPPATH . 'third_party/php-jwt/JWTExceptionWithPayloadInterface.php';
require_once APPPATH . 'third_party/php-jwt/Key.php';
require_once APPPATH . 'third_party/php-jwt/ExpiredException.php';
require_once APPPATH . 'third_party/php-jwt/SignatureInvalidException.php';
require_once APPPATH . 'third_party/php-jwt/BeforeValidException.php';

// Use the firebase/php-jwt library
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\SignatureInvalidException;
use Firebase\JWT\ExpiredException;
use Firebase\JWT\BeforeValidException;

class Users extends CI_Controller
{

  private $jwt_key;

  public function __construct()
  {
    parent::__construct();
    $this->load->model('User_model');
    $this->load->model('Hotel_model');
    $this->load->model('Key_model');
    $this->load->library(array('form_validation', 'session', 'encryption'));
    // The 'id', 'url', and 'form' helpers are now autoloaded.

    $this->jwt_key = $this->config->item('jwt_key');
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
    $this->form_validation->set_rules('business_name', 'Business Name', 'trim|required');
    $this->form_validation->set_rules('trn_number', 'TRN Number', 'trim|required');

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
        'trn_number' => $this->input->post('trn_number'),
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

  public function manage_hotels($user_id)
  {
    $user = $this->User_model->get_user_by_id($user_id);
    if (!$user) {
      show_404();
    }

    $assigned_hotels = $this->User_model->get_hotels_for_user($user_id);
    $all_hotels = $this->User_model->get_hotels();

    // Filter out hotels that are already assigned to the user
    $assigned_hotel_ids = array_column($assigned_hotels, 'id');
    $available_hotels = array_filter($all_hotels, function ($hotel) use ($assigned_hotel_ids) {
      return !in_array($hotel['id'], $assigned_hotel_ids);
    });

    $view_data['user'] = $user;
    $view_data['assigned_hotels'] = $assigned_hotels;
    $view_data['available_hotels'] = $available_hotels;
    $view_data['title'] = 'Manage Hotels for ' . html_escape($user['username']);
    $view_data['main_content'] = 'users/manage_hotels';
    $view_data['active_page'] = 'users/index';
    $this->load->view('layouts/main', $view_data);
  }

  public function add_hotel_to_user()
  {
    $user_id = $this->input->post('user_id');
    $hotel_id = $this->input->post('hotel_id');

    if (!$user_id || !$hotel_id) {
      $this->output->set_content_type('application/json')->set_output(json_encode(['status' => 'error', 'message' => 'User ID and Hotel ID are required.']));
      return;
    }

    if ($this->User_model->add_hotel_to_user($user_id, $hotel_id)) {
      $this->output->set_content_type('application/json')->set_output(json_encode(['status' => 'success', 'message' => 'Hotel added successfully.']));
    } else {
      $this->output->set_content_type('application/json')->set_output(json_encode(['status' => 'error', 'message' => 'Failed to add hotel.']));
    }
  }

  public function create_hotel_for_user()
  {
    $this->form_validation->set_rules('user_id', 'User ID', 'required|integer');
    $this->form_validation->set_rules('hotel_name', 'Hotel Name', 'trim|required');
    $this->form_validation->set_rules('address', 'Address', 'trim');

    if ($this->form_validation->run() == FALSE) {
      $this->output
        ->set_content_type('application/json')
        ->set_output(json_encode(['status' => 'error', 'message' => validation_errors()]));
      return;
    }

    $user_id = $this->input->post('user_id');
    $hotel_name = $this->input->post('hotel_name');
    $address = $this->input->post('address');

    // The model method will handle the transaction
    $new_hotel = $this->User_model->create_and_assign_hotel($user_id, $hotel_name, $address);
    if ($new_hotel) {
      $this->output->set_content_type('application/json')->set_output(json_encode([
        'status' => 'success',
        'message' => 'Hotel created and assigned successfully.'
      ]));
    } else {
      $this->output->set_content_type('application/json')->set_output(json_encode(['status' => 'error', 'message' => 'Failed to create or assign hotel.']));
    }
  }

  public function update()
  {
    $user_id = $this->input->post('user_id');

    // Set validation rules, ensuring uniqueness check ignores the current user
    $this->form_validation->set_rules('username', 'Username', 'trim|required|is_unique[users.username.id.' . $user_id . ']');
    $this->form_validation->set_rules('email', 'Email', 'trim|valid_email|is_unique[users.email.id.' . $user_id . ']');
    $this->form_validation->set_rules('business_name', 'Business Name', 'trim|required');
    $this->form_validation->set_rules('trn_number', 'TRN Number', 'trim|required');

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
        'trn_number' => $this->input->post('trn_number'),
      );

      if ($this->User_model->update_user($user_id, $data)) {
        $response = [
          'status' => 'success',
          'message' => 'User updated successfully.',
          'user' => [
            'id' => $user_id,
            'username' => $data['username'],
            'email' => $data['email'],
            'business_name' => $data['business_name'],
            'trn_number' => $data['trn_number']
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

  public function update_hotel()
  {
    $this->form_validation->set_rules('hotel_id', 'Hotel ID', 'required|integer');
    $this->form_validation->set_rules('name', 'Hotel Name', 'trim|required');
    $this->form_validation->set_rules('address', 'Address', 'trim');

    if ($this->form_validation->run() == FALSE) {
      $this->output->set_content_type('application/json')->set_output(json_encode(['status' => 'error', 'message' => validation_errors()]));
      return;
    }

    $hotel_id = $this->input->post('hotel_id');
    $data = [
      'name' => $this->input->post('name'),
      'address' => $this->input->post('address')
    ];

    if ($this->Hotel_model->update_hotel($hotel_id, $data)) {
      $updated_hotel = $this->Hotel_model->get_hotel_by_id($hotel_id);
      $this->output->set_content_type('application/json')->set_output(json_encode(['status' => 'success', 'message' => 'Hotel updated successfully.', 'hotel' => $updated_hotel]));
    } else {
      $this->output->set_content_type('application/json')->set_output(json_encode(['status' => 'error', 'message' => 'Failed to update hotel.']));
    }
  }

  public function remove_hotel_from_user()
  {
    $this->form_validation->set_rules('user_id', 'User ID', 'required|integer');
    $this->form_validation->set_rules('hotel_id', 'Hotel ID', 'required|integer');

    if ($this->form_validation->run() == FALSE) {
      $this->output->set_content_type('application/json')->set_output(json_encode(['status' => 'error', 'message' => validation_errors()]));
      return;
    }

    $user_id = $this->input->post('user_id');
    $hotel_id = $this->input->post('hotel_id');

    if ($this->Hotel_model->remove_hotel_from_user($user_id, $hotel_id)) {
      $this->output->set_content_type('application/json')->set_output(json_encode(['status' => 'success', 'message' => 'Hotel removed from user successfully.']));
    } else {
      $this->output->set_content_type('application/json')->set_output(json_encode(['status' => 'error', 'message' => 'Failed to remove hotel from user.']));
    }
  }

  public function manage_keys($user_id)
  {
    $user = $this->User_model->get_user_by_id($user_id);
    if (!$user) {
      show_404();
    }

    $view_data['user'] = $user;
    $view_data['assigned_hotels'] = $this->User_model->get_hotels_for_user($user_id);
    $existing_keys = $this->Key_model->get_keys_for_user($user_id);
    // Encrypt the ID for display purposes
    foreach ($existing_keys as &$key) {
      // $key['hotel_ids'] = $this->Key_model->get_hotels_for_key($key['id']);
      $key['encrypted_id'] = $this->encryption->encrypt($key['id']);
    }
    $view_data['existing_keys'] = $existing_keys;

    $view_data['title'] = 'Manage API Keys for ' . html_escape($user['username']);
    $view_data['main_content'] = 'users/manage_keys';
    $view_data['active_page'] = 'users/index';
    $this->load->view('layouts/main', $view_data);
  }

  public function create_key()
  {
    $this->form_validation->set_rules('user_id', 'User ID', 'required|integer');
    $this->form_validation->set_rules('start_date', 'Start Date', 'required');
    $this->form_validation->set_rules('end_date', 'End Date', 'required');
    $this->form_validation->set_rules('hotel_ids[]', 'Hotels', 'required');

    if ($this->form_validation->run() == FALSE) {
      $this->output->set_content_type('application/json')->set_output(json_encode(['status' => 'error', 'message' => validation_errors()]));
      return;
    }

    $user_id = $this->input->post('user_id');
    $start_date = $this->input->post('start_date');
    $end_date = $this->input->post('end_date');
    $hotel_ids = $this->input->post('hotel_ids');

    // Fetch user details to include in the JWT
    $user = $this->User_model->get_user_by_id($user_id);
    if (!$user) {
      $this->output->set_content_type('application/json')->set_output(json_encode(['status' => 'error', 'message' => 'User not found.']));
      return;
    }

    // JWT Payload
    $payload = [
      'iss' => base_url(), // Issuer
      'aud' => base_url(), // Audience
      'iat' => strtotime($start_date), // Issued at
      'nbf' => strtotime($start_date), // Not before
      'exp' => strtotime($end_date), // Expiration
      'data' => [
        'userId' => $user_id,
        'hotelIds' => array_map('intval', $hotel_ids),
        'business_name' => $user['business_name'],
        'trn_number' => $user['trn_number']
      ]
    ];

    $jwt = JWT::encode($payload, $this->jwt_key, 'HS256');

    $key_data = [
      'user_id' => $user_id,
      'token' => $jwt,
      'start_date' => $start_date,
      'end_date' => $end_date,
      'status' => 'generated' // Default status
    ];

    $new_key_id = $this->Key_model->create_key($key_data, $hotel_ids);
    if ($new_key_id) {
      $this->output->set_content_type('application/json')->set_output(json_encode([
        'status' => 'success',
        'message' => 'API Key created successfully.',
        'token' => $jwt,
        'encrypted_id' => $this->encryption->encrypt($new_key_id)
      ]));
    } else {
      $this->output->set_content_type('application/json')->set_output(json_encode(['status' => 'error', 'message' => 'Failed to create API Key.']));
    }
  }

  public function delete_key()
  {
    $this->form_validation->set_rules('key_id', 'Key ID', 'required');

    if ($this->form_validation->run() == FALSE) {
      $this->output->set_content_type('application/json')->set_output(json_encode(['status' => 'error', 'message' => validation_errors()]));
      return;
    }

    $encrypted_key_id = $this->input->post('key_id');
    $key_id = $this->encryption->decrypt($encrypted_key_id);

    if (!$key_id) {
      $this->output->set_content_type('application/json')->set_output(json_encode(['status' => 'error', 'message' => 'Invalid Key ID.']));
      return;
    }

    if ($this->Key_model->delete_key($key_id)) {
      $this->output->set_content_type('application/json')->set_output(json_encode(['status' => 'success', 'message' => 'API Key deleted successfully.']));
    } else {
      $this->output->set_content_type('application/json')->set_output(json_encode(['status' => 'error', 'message' => 'Failed to delete API Key.']));
    }
  }
}