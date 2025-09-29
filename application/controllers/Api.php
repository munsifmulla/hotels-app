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

class Api extends CI_Controller
{

  public function __construct()
  {
    parent::__construct();
    $this->load->model('User_model');
    $this->load->model('Key_model');
    $this->load->model('Room_type_model');
    $this->load->library('encryption');
    $this->output->set_content_type('application/json');
  }

  public function login()
  {
    // Get the JSON input
    $input = json_decode(file_get_contents('php://input'), true);

    $username = isset($input['username']) ? $input['username'] : null;
    $password = isset($input['password']) ? $input['password'] : null;

    if (!$username || !$password) {
      $this->output->set_status_header(400)->set_output(json_encode(['status' => 'error', 'message' => 'Username and password are required.']));
      return;
    }

    // Find user by username
    $this->db->where('username', $username);
    $user = $this->db->get('users')->row_array();

    // Verify user and password
    if (!$user || !password_verify($password, $user['password'])) {
      $this->output->set_status_header(401)->set_output(json_encode(['status' => 'error', 'message' => 'Invalid credentials.']));
      return;
    }

    // Check for an existing subscription key
    $subscription_key = $this->Key_model->get_keys_for_user($user['id']);
    if (empty($subscription_key)) {
      $this->output->set_status_header(403)->set_output(json_encode(['status' => 'error', 'message' => 'No subscription key found for this user.']));
      return;
    }

    // Since we enforce one key per user, we take the first one.
    $key = $subscription_key[0];

    // Check if the key has expired
    if (strtotime($key['end_date']) < time()) {
      $this->output->set_status_header(403)->set_output(json_encode(['status' => 'expired_key', 'message' => 'Your subscription has expired. Please renew.']));
      return;
    }

    // Check if the key is active
    if ($key['status'] !== 'active') {
      // Key is not active, but we need to return the token for the activation step.
      $response_data = [
        'status' => 'inactive',
        'message' => 'Your subscription key is not active. Please activate it.',
        'token' => $key['token']
      ];
      $this->output->set_status_header(200)->set_output(json_encode($response_data));
      return;
    }

    // If all checks pass, get assigned hotels and return the token
    $response_data = [
      'status' => 'success',
      'message' => 'Login successful.',
      'token' => $key['token']
    ];

    $this->output->set_status_header(200)->set_output(json_encode($response_data));
  }

  private function _validate_token()
  {
    $auth_header = $this->input->get_request_header('Authorization');
    if (!$auth_header) {
      $this->output->set_status_header(401)->set_output(json_encode(['status' => 'error', 'message' => 'Authorization header is missing.']));
      return false;
    }

    if (preg_match('/Bearer\s(\S+)/', $auth_header, $matches)) {
      $token = $matches[1];
    } else {
      $this->output->set_status_header(401)->set_output(json_encode(['status' => 'error', 'message' => 'Malformed token.']));
      return false;
    }

    try {
      $key = new Key($this->config->item('jwt_key'), 'HS256');
      $payload = JWT::decode($token, $key);
      return $payload;
    } catch (Exception $e) {
      $this->output->set_status_header(401)->set_output(json_encode(['status' => 'error', 'message' => 'Invalid or expired token.']));
      return false;
    }
  }

  public function activate_key()
  {
    // 1. Validate the token and get user data
    $payload = $this->_validate_token();
    if (!$payload) {
      return; // Error response is already sent by _validate_token
    }
    $user_id = $payload->data->userId;

    // 2. Get the encrypted key ID from the request body
    $input = json_decode(file_get_contents('php://input'), true);
    $app_activation_key = isset($input['app_activation_key']) ? $input['app_activation_key'] : null;

    if (!$app_activation_key) {
      $this->output->set_status_header(400)->set_output(json_encode(['status' => 'error', 'message' => 'Application activation key is required.']));
      return;
    }

    // 3. Decrypt the ID
    $key_id = $this->encryption->decrypt($app_activation_key);
    if (!$key_id) {
      $this->output->set_status_header(400)->set_output(json_encode(['status' => 'error', 'message' => 'Invalid key ID format.']));
      return;
    }

    // 4. Verify the user owns this key
    $key_details = $this->Key_model->get_key_by_id($key_id);
    if (!$key_details || $key_details['user_id'] != $user_id) {
      $this->output->set_status_header(404)->set_output(json_encode(['status' => 'error', 'message' => 'Subscription key not found or you are not authorized to activate it.']));
      return;
    }

    // Check if the key has already expired
    if (strtotime($key_details['end_date']) < time()) {
      $this->output->set_status_header(403)->set_output(json_encode(['status' => 'expired_key', 'message' => 'This key has already expired.']));
      return;
    }

    // Check if the key is already active
    if ($key_details['status'] === 'active') {
      $this->output->set_status_header(200)->set_output(json_encode(['status' => 'app-already-activated', 'message' => 'Your application is already activated.']));
      return;
    }

    // 5. Update the key status to 'active'
    $update_data = ['status' => 'active'];
    if ($this->Key_model->update_key($key_id, $update_data)) {
      $this->output->set_status_header(200)->set_output(json_encode(['status' => 'app-activated', 'message' => 'Your application has been activated successfully.']));
    } else {
      $this->output->set_status_header(500)->set_output(json_encode(['status' => 'error', 'message' => 'Failed to activate the application. Please try again.']));
    }
  }

  public function get_hotels()
  {
    // 1. Validate the token and get user data
    $payload = $this->_validate_token();
    if (!$payload) {
      return; // Error response is already sent by _validate_token
    }
    $user_id = $payload->data->userId;

    // 2. Fetch the user's subscription key from the database
    $subscription_key_data = $this->Key_model->get_keys_for_user($user_id);
    if (empty($subscription_key_data)) {
      $this->output->set_status_header(403)->set_output(json_encode(['status' => 'error', 'message' => 'No subscription key found for this user.']));
      return;
    }

    // 3. Decode the token from the database to get the subscribed hotel IDs
    $subscribed_hotel_ids = [];
    try {
      $db_token = $subscription_key_data[0]['token'];
      $db_payload = JWT::decode($db_token, new Key($this->config->item('jwt_key'), 'HS256'));
      $subscribed_hotel_ids = isset($db_payload->data->hotelIds) ? (array) $db_payload->data->hotelIds : [];
    } catch (Exception $e) {
      $this->output->set_status_header(500)->set_output(json_encode(['status' => 'error', 'message' => 'Could not read subscription key permissions.']));
      return;
    }

    // 4. Fetch all hotels assigned to the user
    $all_assigned_hotels = $this->User_model->get_hotels_for_user($user_id);

    // 5. Compare assigned hotels with subscribed hotels and build the response
    $response_hotels = [];
    foreach ($all_assigned_hotels as $hotel) {
      if (in_array($hotel['id'], $subscribed_hotel_ids)) {
        // This hotel is in the token's scope, include all details
        $hotel['status'] = 'subscribed';
        $response_hotels[] = $hotel;
      } else {
        // This hotel is not in the token's scope
        $response_hotels[] = [
          'name' => $hotel['name'],
          'address' => $hotel['address'],
          'status' => 'not subscribed'
        ];
      }
    }

    // 6. Return the data
    $this->output
      ->set_status_header(200)
      ->set_output(json_encode($response_hotels));
  }

  public function get_room_types($hotel_id)
  {
    // 1. Validate token and get user data
    $payload = $this->_validate_token();
    if (!$payload) {
      return;
    }

    // 2. Authorization Check: Does the user's key grant access to this hotel?
    $subscription_key_data = $this->Key_model->get_keys_for_user($payload->data->userId);
    $db_token = $subscription_key_data[0]['token'];
    $db_payload = JWT::decode($db_token, new Key($this->config->item('jwt_key'), 'HS256'));
    $subscribed_hotel_ids = isset($db_payload->data->hotelIds) ? (array) $db_payload->data->hotelIds : [];

    if (!in_array($hotel_id, $subscribed_hotel_ids)) {
      $this->output->set_status_header(403)->set_output(json_encode(['status' => 'error', 'message' => 'You are not subscribed to this hotel.']));
      return;
    }

    // 3. Fetch and return room types
    $room_types = $this->Room_type_model->get_room_types_for_hotel($hotel_id);
    $this->output->set_status_header(200)->set_output(json_encode($room_types));
  }

  public function create_room_type()
  {
    // 1. Validate token
    $payload = $this->_validate_token();
    if (!$payload) {
      return;
    }

    // 2. Get input and validate
    $input = json_decode(file_get_contents('php://input'), true);
    $hotel_id = isset($input['hotel_id']) ? $input['hotel_id'] : null;
    $name = isset($input['name']) ? trim($input['name']) : null;

    if (!$hotel_id || !$name) {
      $this->output->set_status_header(400)->set_output(json_encode(['status' => 'error', 'message' => 'Hotel ID and Room Type Name are required.']));
      return;
    }

    // 3. Authorization Check
    $subscription_key_data = $this->Key_model->get_keys_for_user($payload->data->userId);
    $db_token = $subscription_key_data[0]['token'];
    $db_payload = JWT::decode($db_token, new Key($this->config->item('jwt_key'), 'HS256'));
    $subscribed_hotel_ids = isset($db_payload->data->hotelIds) ? (array) $db_payload->data->hotelIds : [];

    if (!in_array($hotel_id, $subscribed_hotel_ids)) {
      $this->output->set_status_header(403)->set_output(json_encode(['status' => 'error', 'message' => 'You are not authorized to add room types to this hotel.']));
      return;
    }

    // Check for name uniqueness within the hotel
    if (!$this->Room_type_model->is_name_unique($hotel_id, $name)) {
      $this->output->set_status_header(400)->set_output(json_encode(['status' => 'error', 'message' => 'This room type name already exists for this hotel.']));
      return;
    }

    // 4. Create room type
    $data = [
      'hotel_id' => $hotel_id,
      'name' => $name,
      'description' => isset($input['description']) ? $input['description'] : null
    ];

    $new_room_type = $this->Room_type_model->create_room_type($data);
    if ($new_room_type) {
      $this->output->set_status_header(201)->set_output(json_encode($new_room_type));
    } else {
      $this->output->set_status_header(500)->set_output(json_encode(['status' => 'error', 'message' => 'Failed to create room type.']));
    }
  }

  public function update_room_type()
  {
    // 1. Validate token
    $payload = $this->_validate_token();
    if (!$payload) {
      return;
    }

    // 2. Get input and validate
    $input = json_decode(file_get_contents('php://input'), true);
    $room_type_id = isset($input['room_type_id']) ? $input['room_type_id'] : null;
    $name = isset($input['name']) ? trim($input['name']) : null;

    if (!$room_type_id || !$name) {
      $this->output->set_status_header(400)->set_output(json_encode(['status' => 'error', 'message' => 'Room Type ID and Name are required.']));
      return;
    }

    // 3. Authorization Check
    $room_type = $this->Room_type_model->get_room_type_by_id($room_type_id);
    if (!$room_type) {
      $this->output->set_status_header(404)->set_output(json_encode(['status' => 'error', 'message' => 'Room type not found.']));
      return;
    }

    $subscription_key_data = $this->Key_model->get_keys_for_user($payload->data->userId);
    $db_token = $subscription_key_data[0]['token'];
    $db_payload = JWT::decode($db_token, new Key($this->config->item('jwt_key'), 'HS256'));
    $subscribed_hotel_ids = isset($db_payload->data->hotelIds) ? (array) $db_payload->data->hotelIds : [];

    if (!in_array($room_type['hotel_id'], $subscribed_hotel_ids)) {
      $this->output->set_status_header(403)->set_output(json_encode(['status' => 'error', 'message' => 'You are not authorized to modify this room type.']));
      return;
    }

    // Check for name uniqueness within the hotel, excluding the current room type
    if (!$this->Room_type_model->is_name_unique($room_type['hotel_id'], $name, $room_type_id)) {
      $this->output->set_status_header(400)->set_output(json_encode(['status' => 'error', 'message' => 'This room type name already exists for this hotel.']));
      return;
    }

    // 4. Update room type
    $data = [
      'name' => $name,
      'description' => isset($input['description']) ? $input['description'] : null
    ];

    if ($this->Room_type_model->update_room_type($room_type_id, $data)) {
      $this->output->set_status_header(200)->set_output(json_encode(['status' => 'success', 'message' => 'Room type updated successfully.']));
    } else {
      $this->output->set_status_header(500)->set_output(json_encode(['status' => 'error', 'message' => 'Failed to update room type.']));
    }
  }

  public function delete_room_type()
  {
    // 1. Validate token
    $payload = $this->_validate_token();
    if (!$payload) {
      return;
    }

    // 2. Get input and validate
    $input = json_decode(file_get_contents('php://input'), true);
    $room_type_id = isset($input['room_type_id']) ? $input['room_type_id'] : null;

    if (!$room_type_id) {
      $this->output->set_status_header(400)->set_output(json_encode(['status' => 'error', 'message' => 'Room Type ID is required.']));
      return;
    }

    // 3. Authorization Check
    $room_type = $this->Room_type_model->get_room_type_by_id($room_type_id);
    if (!$room_type) {
      $this->output->set_status_header(404)->set_output(json_encode(['status' => 'error', 'message' => 'Room type not found.']));
      return;
    }

    $subscription_key_data = $this->Key_model->get_keys_for_user($payload->data->userId);
    $db_token = $subscription_key_data[0]['token'];
    $db_payload = JWT::decode($db_token, new Key($this->config->item('jwt_key'), 'HS256'));
    $subscribed_hotel_ids = isset($db_payload->data->hotelIds) ? (array) $db_payload->data->hotelIds : [];

    if (!in_array($room_type['hotel_id'], $subscribed_hotel_ids)) {
      $this->output->set_status_header(403)->set_output(json_encode(['status' => 'error', 'message' => 'You are not authorized to delete this room type.']));
      return;
    }


    // 4. Delete room type
    if ($this->Room_type_model->delete_room_type($room_type_id)) {
      $this->output->set_status_header(200)->set_output(json_encode(['status' => 'success', 'message' => 'Room type deleted successfully.']));
    } else {
      $this->output->set_status_header(500)->set_output(json_encode(['status' => 'error', 'message' => 'Failed to delete room type. It might be in use.']));
    }
  }
}