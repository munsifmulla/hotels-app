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
    $this->load->model('Room_model');
    $this->load->model('Guest_model');
    $this->load->model('Booking_model');
    $this->load->model('Invoice_model');
    $this->load->model('Service_model');
    $this->load->model('Service_type_model');
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

  public function create_room()
  {
    // 1. Validate token
    $payload = $this->_validate_token();
    if (!$payload) {
      return;
    }

    // 2. Get input and validate
    $input = json_decode(file_get_contents('php://input'), true);
    $hotel_id = isset($input['hotel_id']) ? $input['hotel_id'] : null;
    $room_type_id = isset($input['room_type_id']) ? $input['room_type_id'] : null;
    $room_number = isset($input['room_number']) ? trim($input['room_number']) : null;
    $price_per_night = isset($input['price_per_night']) ? $input['price_per_night'] : null;

    if (!$hotel_id || !$room_type_id || !$room_number || $price_per_night === null) {
      $this->output->set_status_header(400)->set_output(json_encode(['status' => 'error', 'message' => 'Hotel ID, Room Type ID, Room Number, and Price are required.']));
      return;
    }

    // 3. Authorization Check
    $subscription_key_data = $this->Key_model->get_keys_for_user($payload->data->userId);
    $db_token = $subscription_key_data[0]['token'];
    $db_payload = JWT::decode($db_token, new Key($this->config->item('jwt_key'), 'HS256'));
    $subscribed_hotel_ids = isset($db_payload->data->hotelIds) ? (array) $db_payload->data->hotelIds : [];

    if (!in_array($hotel_id, $subscribed_hotel_ids)) {
      $this->output->set_status_header(403)->set_output(json_encode(['status' => 'error', 'message' => 'You are not authorized to add rooms to this hotel.']));
      return;
    }

    // 4. Check for unique room number within the hotel
    if (!$this->Room_model->is_room_number_unique($hotel_id, $room_number)) {
      $this->output->set_status_header(400)->set_output(json_encode(['status' => 'error', 'message' => 'This room number already exists for this hotel.']));
      return;
    }

    // 5. Prepare data for insertion
    $data = [
      'hotel_id' => $hotel_id,
      'room_type_id' => $room_type_id,
      'room_number' => $room_number,
      'price_per_night' => $price_per_night,
      'status' => 'vacant', // Default status
      'number_of_beds' => isset($input['number_of_beds']) ? (int) $input['number_of_beds'] : 1,
      'number_of_bathrooms' => isset($input['number_of_bathrooms']) ? (int) $input['number_of_bathrooms'] : 1,
      'has_tv' => isset($input['has_tv']) ? (bool) $input['has_tv'] : false,
      'has_kitchen' => isset($input['has_kitchen']) ? (bool) $input['has_kitchen'] : false,
      'has_fridge' => isset($input['has_fridge']) ? (bool) $input['has_fridge'] : false,
      'has_ac' => isset($input['has_ac']) ? (bool) $input['has_ac'] : false,
    ];

    // 6. Create room
    $new_room = $this->Room_model->create_room($data);
    if ($new_room) {
      $this->output->set_status_header(201)->set_output(json_encode($new_room));
    } else {
      $this->output->set_status_header(500)->set_output(json_encode(['status' => 'error', 'message' => 'Failed to create room.']));
    }
  }

  public function get_rooms($hotel_id)
  {
    // 1. Validate token and get user data
    $payload = $this->_validate_token();
    if (!$payload) {
      return;
    }

    // 2. Authorization Check: Does the user's key grant access to this hotel?
    $subscription_key_data = $this->Key_model->get_keys_for_user($payload->data->userId);
    if (empty($subscription_key_data)) {
      $this->output->set_status_header(403)->set_output(json_encode(['status' => 'error', 'message' => 'No subscription key found for this user.']));
      return;
    }

    try {
      $db_token = $subscription_key_data[0]['token'];
      $db_payload = JWT::decode($db_token, new Key($this->config->item('jwt_key'), 'HS256'));
      $subscribed_hotel_ids = isset($db_payload->data->hotelIds) ? (array) $db_payload->data->hotelIds : [];
    } catch (Exception $e) {
      $this->output->set_status_header(500)->set_output(json_encode(['status' => 'error', 'message' => 'Could not read subscription key permissions.']));
      return;
    }

    if (!in_array($hotel_id, $subscribed_hotel_ids)) {
      $this->output->set_status_header(403)->set_output(json_encode(['status' => 'error', 'message' => 'You are not subscribed to this hotel.']));
      return;
    }

    // 3. Fetch and return rooms
    $rooms = $this->Room_model->get_rooms_for_hotel($hotel_id);
    $this->output->set_status_header(200)->set_output(json_encode($rooms));
  }

  public function update_room()
  {
    // 1. Validate token
    $payload = $this->_validate_token();
    if (!$payload) {
      return;
    }

    // 2. Get input and validate
    $input = json_decode(file_get_contents('php://input'), true);
    $room_id = isset($input['room_id']) ? $input['room_id'] : null;

    if (!$room_id) {
      $this->output->set_status_header(400)->set_output(json_encode(['status' => 'error', 'message' => 'Room ID is required.']));
      return;
    }

    // 3. Authorization Check
    $room = $this->Room_model->get_room_by_id($room_id);
    if (!$room) {
      $this->output->set_status_header(404)->set_output(json_encode(['status' => 'error', 'message' => 'Room not found.']));
      return;
    }

    $subscription_key_data = $this->Key_model->get_keys_for_user($payload->data->userId);
    $db_token = $subscription_key_data[0]['token'];
    $db_payload = JWT::decode($db_token, new Key($this->config->item('jwt_key'), 'HS256'));
    $subscribed_hotel_ids = isset($db_payload->data->hotelIds) ? (array) $db_payload->data->hotelIds : [];

    if (!in_array($room['hotel_id'], $subscribed_hotel_ids)) {
      $this->output->set_status_header(403)->set_output(json_encode(['status' => 'error', 'message' => 'You are not authorized to modify this room.']));
      return;
    }

    // 4. Check for unique room number if it's being changed
    if (isset($input['room_number']) && $input['room_number'] !== $room['room_number']) {
      if (!$this->Room_model->is_room_number_unique($room['hotel_id'], $input['room_number'], $room_id)) {
        $this->output->set_status_header(400)->set_output(json_encode(['status' => 'error', 'message' => 'This room number already exists for this hotel.']));
        return;
      }
    }

    // 5. Prepare data for update
    $data = [];
    $updatable_fields = [
      'room_type_id',
      'room_number',
      'price_per_night',
      'status',
      'number_of_beds',
      'number_of_bathrooms',
      'has_tv',
      'has_kitchen',
      'has_fridge',
      'has_ac'
    ];

    foreach ($updatable_fields as $field) {
      if (isset($input[$field])) {
        $data[$field] = $input[$field];
      }
    }

    if (empty($data)) {
      $this->output->set_status_header(400)->set_output(json_encode(['status' => 'error', 'message' => 'No updatable fields provided.']));
      return;
    }

    // 6. Update room
    if ($this->Room_model->update_room($room_id, $data)) {
      $this->output->set_status_header(200)->set_output(json_encode(['status' => 'success', 'message' => 'Room updated successfully.']));
    } else {
      $this->output->set_status_header(500)->set_output(json_encode(['status' => 'error', 'message' => 'Failed to update room.']));
    }
  }

  public function delete_room()
  {
    // 1. Validate token
    $payload = $this->_validate_token();
    if (!$payload) {
      return;
    }

    // 2. Get input and validate
    $input = json_decode(file_get_contents('php://input'), true);
    $room_id = isset($input['room_id']) ? $input['room_id'] : null;

    if (!$room_id) {
      $this->output->set_status_header(400)->set_output(json_encode(['status' => 'error', 'message' => 'Room ID is required.']));
      return;
    }

    // 3. Authorization Check
    $room = $this->Room_model->get_room_by_id($room_id);
    if (!$room) {
      $this->output->set_status_header(404)->set_output(json_encode(['status' => 'error', 'message' => 'Room not found.']));
      return;
    }

    $subscription_key_data = $this->Key_model->get_keys_for_user($payload->data->userId);
    $db_token = $subscription_key_data[0]['token'];
    $db_payload = JWT::decode($db_token, new Key($this->config->item('jwt_key'), 'HS256'));
    $subscribed_hotel_ids = isset($db_payload->data->hotelIds) ? (array) $db_payload->data->hotelIds : [];

    if (!in_array($room['hotel_id'], $subscribed_hotel_ids)) {
      $this->output->set_status_header(403)->set_output(json_encode(['status' => 'error', 'message' => 'You are not authorized to delete this room.']));
      return;
    }

    // 4. Delete room
    if ($this->Room_model->delete_room($room_id)) {
      $this->output->set_status_header(200)->set_output(json_encode(['status' => 'success', 'message' => 'Room deleted successfully.']));
    } else {
      $this->output->set_status_header(500)->set_output(json_encode(['status' => 'error', 'message' => 'Failed to delete room.']));
    }
  }

  public function create_guest()
  {
    $payload = $this->_validate_token();
    if (!$payload)
      return;

    $input = json_decode(file_get_contents('php://input'), true);
    $hotel_id = isset($input['hotel_id']) ? $input['hotel_id'] : null;

    // Basic validation
    if (!$hotel_id || empty($input['first_name']) || empty($input['email'])) {
      $this->output->set_status_header(400)->set_output(json_encode(['status' => 'error', 'message' => 'Hotel ID, First Name, and Email are required.']));
      return;
    }

    // Authorization check
    if (!$this->_is_user_subscribed_to_hotel($payload->data->userId, $hotel_id)) {
      $this->output->set_status_header(403)->set_output(json_encode(['status' => 'error', 'message' => 'You are not authorized to manage guests for this hotel.']));
      return;
    }

    // Unique email check for the hotel
    if (!$this->Guest_model->is_email_unique_for_hotel($hotel_id, $input['email'])) {
      $this->output->set_status_header(400)->set_output(json_encode(['status' => 'error', 'message' => 'This email address is already registered for a guest at this hotel.']));
      return;
    }

    $data = [
      'hotel_id' => $hotel_id,
      'first_name' => $input['first_name'],
      'last_name' => isset($input['last_name']) ? $input['last_name'] : null,
      'email' => $input['email'],
      'phone' => isset($input['phone']) ? $input['phone'] : null,
      'address' => isset($input['address']) ? $input['address'] : null,
      'govt_id' => isset($input['govt_id_number']) ? $input['govt_id_number'] : null,
    ];

    $new_guest = $this->Guest_model->create_guest($data);
    if ($new_guest) {
      $this->output->set_status_header(201)->set_output(json_encode($new_guest));
    } else {
      $this->output->set_status_header(500)->set_output(json_encode(['status' => 'error', 'message' => 'Failed to create guest.']));
    }
  }

  public function get_guests_for_hotel($hotel_id)
  {
    $payload = $this->_validate_token();
    if (!$payload)
      return;

    if (!$this->_is_user_subscribed_to_hotel($payload->data->userId, $hotel_id)) {
      $this->output->set_status_header(403)->set_output(json_encode(['status' => 'error', 'message' => 'You are not authorized to view guests for this hotel.']));
      return;
    }

    $guests = $this->Guest_model->get_guests_for_hotel($hotel_id);
    $this->output->set_status_header(200)->set_output(json_encode($guests));
  }

  public function get_guest($guest_id)
  {
    $payload = $this->_validate_token();
    if (!$payload)
      return;

    $guest = $this->Guest_model->get_guest_by_id($guest_id);
    if (!$guest) {
      $this->output->set_status_header(404)->set_output(json_encode(['status' => 'error', 'message' => 'Guest not found.']));
      return;
    }

    if (!$this->_is_user_subscribed_to_hotel($payload->data->userId, $guest['hotel_id'])) {
      $this->output->set_status_header(403)->set_output(json_encode(['status' => 'error', 'message' => 'You are not authorized to view this guest.']));
      return;
    }

    $this->output->set_status_header(200)->set_output(json_encode($guest));
  }

  public function update_guest()
  {
    $payload = $this->_validate_token();
    if (!$payload)
      return;

    $input = json_decode(file_get_contents('php://input'), true);
    $guest_id = isset($input['guest_id']) ? $input['guest_id'] : null;

    if (!$guest_id) {
      $this->output->set_status_header(400)->set_output(json_encode(['status' => 'error', 'message' => 'Guest ID is required.']));
      return;
    }

    $guest = $this->Guest_model->get_guest_by_id($guest_id);
    if (!$guest) {
      $this->output->set_status_header(404)->set_output(json_encode(['status' => 'error', 'message' => 'Guest not found.']));
      return;
    }

    if (!$this->_is_user_subscribed_to_hotel($payload->data->userId, $guest['hotel_id'])) {
      $this->output->set_status_header(403)->set_output(json_encode(['status' => 'error', 'message' => 'You are not authorized to modify this guest.']));
      return;
    }

    if (isset($input['email']) && $input['email'] !== $guest['email']) {
      if (!$this->Guest_model->is_email_unique_for_hotel($guest['hotel_id'], $input['email'], $guest_id)) {
        $this->output->set_status_header(400)->set_output(json_encode(['status' => 'error', 'message' => 'This email address is already in use by another guest at this hotel.']));
        return;
      }
    }

    $data = [];
    $fields = ['first_name', 'last_name', 'email', 'phone', 'address', 'govt_id'];
    foreach ($fields as $field) {
      if (isset($input[$field])) {
        $data[$field] = $input[$field];
      }
    }

    if ($this->Guest_model->update_guest($guest_id, $data)) {
      $this->output->set_status_header(200)->set_output(json_encode(['status' => 'success', 'message' => 'Guest updated successfully.']));
    } else {
      $this->output->set_status_header(500)->set_output(json_encode(['status' => 'error', 'message' => 'Failed to update guest.']));
    }
  }

  public function delete_guest()
  {
    $payload = $this->_validate_token();
    if (!$payload)
      return;

    $input = json_decode(file_get_contents('php://input'), true);
    $guest_id = isset($input['guest_id']) ? $input['guest_id'] : null;

    if (!$guest_id) {
      $this->output->set_status_header(400)->set_output(json_encode(['status' => 'error', 'message' => 'Guest ID is required.']));
      return;
    }

    $guest = $this->Guest_model->get_guest_by_id($guest_id);
    if (!$guest) {
      $this->output->set_status_header(404)->set_output(json_encode(['status' => 'error', 'message' => 'Guest not found.']));
      return;
    }

    if (!$this->_is_user_subscribed_to_hotel($payload->data->userId, $guest['hotel_id'])) {
      $this->output->set_status_header(403)->set_output(json_encode(['status' => 'error', 'message' => 'You are not authorized to delete this guest.']));
      return;
    }

    if ($this->Guest_model->delete_guest($guest_id)) {
      $this->output->set_status_header(200)->set_output(json_encode(['status' => 'success', 'message' => 'Guest deleted successfully.']));
    } else {
      $this->output->set_status_header(500)->set_output(json_encode(['status' => 'error', 'message' => 'Failed to delete guest.']));
    }
  }

  private function _is_user_subscribed_to_hotel($user_id, $hotel_id)
  {
    $subscription_key_data = $this->Key_model->get_keys_for_user($user_id);
    if (empty($subscription_key_data)) {
      return false;
    }

    try {
      $db_token = $subscription_key_data[0]['token'];
      $db_payload = JWT::decode($db_token, new Key($this->config->item('jwt_key'), 'HS256'));
      $subscribed_hotel_ids = isset($db_payload->data->hotelIds) ? (array) $db_payload->data->hotelIds : [];
      return in_array($hotel_id, $subscribed_hotel_ids);
    } catch (Exception $e) {
      return false;
    }
  }

  public function create_booking()
  {
    $payload = $this->_validate_token();
    if (!$payload)
      return;

    $input = json_decode(file_get_contents('php://input'), true);

    // Basic validation
    $required_fields = ['hotel_id', 'guest_id', 'room_id', 'check_in_date', 'check_out_date', 'total_price'];
    foreach ($required_fields as $field) {
      if (empty($input[$field])) {
        $this->output->set_status_header(400)->set_output(json_encode(['status' => 'error', 'message' => 'Missing required fields.']));
        return;
      }
    }

    // Authorization check
    if (!$this->_is_user_subscribed_to_hotel($payload->data->userId, $input['hotel_id'])) {
      $this->output->set_status_header(403)->set_output(json_encode(['status' => 'error', 'message' => 'You are not authorized to create bookings for this hotel.']));
      return;
    }

    $data = [
      'hotel_id' => $input['hotel_id'],
      'guest_id' => $input['guest_id'],
      'room_id' => $input['room_id'],
      'check_in_date' => $input['check_in_date'],
      'check_out_date' => $input['check_out_date'],
      'total_price' => $input['total_price'],
      'advance_amount' => isset($input['advance_amount']) ? $input['advance_amount'] : 0.00,
      'status' => isset($input['status']) ? $input['status'] : 'confirmed',
    ];

    $new_booking = $this->Booking_model->create_booking($data);
    if ($new_booking) {
      $this->output->set_status_header(201)->set_output(json_encode($new_booking));
    } else {
      $this->output->set_status_header(500)->set_output(json_encode(['status' => 'error', 'message' => 'Failed to create booking.']));
    }
  }

  public function get_bookings_for_hotel($hotel_id)
  {
    $payload = $this->_validate_token();
    if (!$payload)
      return;

    if (!$this->_is_user_subscribed_to_hotel($payload->data->userId, $hotel_id)) {
      $this->output->set_status_header(403)->set_output(json_encode(['status' => 'error', 'message' => 'You are not authorized to view bookings for this hotel.']));
      return;
    }

    $bookings = $this->Booking_model->get_bookings_for_hotel($hotel_id);
    $this->output->set_status_header(200)->set_output(json_encode($bookings));
  }

  public function get_booking($booking_id)
  {
    $payload = $this->_validate_token();
    if (!$payload)
      return;

    $booking = $this->Booking_model->get_booking_by_id($booking_id);
    if (!$booking) {
      $this->output->set_status_header(404)->set_output(json_encode(['status' => 'error', 'message' => 'Booking not found.']));
      return;
    }

    if (!$this->_is_user_subscribed_to_hotel($payload->data->userId, $booking['hotel_id'])) {
      $this->output->set_status_header(403)->set_output(json_encode(['status' => 'error', 'message' => 'You are not authorized to view this booking.']));
      return;
    }

    $this->output->set_status_header(200)->set_output(json_encode($booking));
  }

  public function update_booking()
  {
    $payload = $this->_validate_token();
    if (!$payload)
      return;

    $input = json_decode(file_get_contents('php://input'), true);
    $booking_id = isset($input['booking_id']) ? $input['booking_id'] : null;

    if (!$booking_id) {
      $this->output->set_status_header(400)->set_output(json_encode(['status' => 'error', 'message' => 'Booking ID is required.']));
      return;
    }

    $booking = $this->Booking_model->get_booking_by_id($booking_id);
    if (!$booking) {
      $this->output->set_status_header(404)->set_output(json_encode(['status' => 'error', 'message' => 'Booking not found.']));
      return;
    }

    if (!$this->_is_user_subscribed_to_hotel($payload->data->userId, $booking['hotel_id'])) {
      $this->output->set_status_header(403)->set_output(json_encode(['status' => 'error', 'message' => 'You are not authorized to modify this booking.']));
      return;
    }

    $data = [];
    $fields = ['check_in_date', 'check_out_date', 'status', 'total_price'];
    foreach ($fields as $field) {
      if (isset($input[$field])) {
        $data[$field] = $input[$field];
      }
    }

    if ($this->Booking_model->update_booking($booking_id, $data)) {
      $this->output->set_status_header(200)->set_output(json_encode(['status' => 'success', 'message' => 'Booking updated successfully.']));
    } else {
      $this->output->set_status_header(500)->set_output(json_encode(['status' => 'error', 'message' => 'Failed to update booking.']));
    }
  }

  public function delete_booking()
  {
    $payload = $this->_validate_token();
    if (!$payload)
      return;

    $input = json_decode(file_get_contents('php://input'), true);
    $booking_id = isset($input['booking_id']) ? $input['booking_id'] : null;

    if (!$booking_id) {
      $this->output->set_status_header(400)->set_output(json_encode(['status' => 'error', 'message' => 'Booking ID is required.']));
      return;
    }

    $booking = $this->Booking_model->get_booking_by_id($booking_id);
    if (!$booking) {
      $this->output->set_status_header(404)->set_output(json_encode(['status' => 'error', 'message' => 'Booking not found.']));
      return;
    }

    if (!$this->_is_user_subscribed_to_hotel($payload->data->userId, $booking['hotel_id'])) {
      $this->output->set_status_header(403)->set_output(json_encode(['status' => 'error', 'message' => 'You are not authorized to delete this booking.']));
      return;
    }

    if ($this->Booking_model->delete_booking($booking_id)) {
      $this->output->set_status_header(200)->set_output(json_encode(['status' => 'success', 'message' => 'Booking deleted successfully.']));
    } else {
      $this->output->set_status_header(500)->set_output(json_encode(['status' => 'error', 'message' => 'Failed to delete booking.']));
    }
  }

  public function get_bookings_for_room($room_id)
  {
    $payload = $this->_validate_token();
    if (!$payload) {
      return;
    }

    // Authorization check: Ensure user is subscribed to the hotel this room belongs to.
    $room = $this->Room_model->get_room_by_id($room_id);
    if (!$room) {
      $this->output->set_status_header(404)->set_output(json_encode(['status' => 'error', 'message' => 'Room not found.']));
      return;
    }

    if (!$this->_is_user_subscribed_to_hotel($payload->data->userId, $room['hotel_id'])) {
      $this->output->set_status_header(403)->set_output(json_encode(['status' => 'error', 'message' => 'You are not authorized to view bookings for this room.']));
      return;
    }

    // Fetch and return bookings for the specific room
    $bookings = $this->Booking_model->get_bookings_for_room($room_id);
    $this->output->set_status_header(200)->set_output(json_encode($bookings));
  }

  public function search_guests($hotel_id)
  {
    $payload = $this->_validate_token();
    if (!$payload) {
      return;
    }

    $search_term = $this->input->get('q');
    if (!$search_term) {
      $this->output->set_status_header(400)->set_output(json_encode(['status' => 'error', 'message' => 'A search term is required. Use the "q" query parameter.']));
      return;
    }

    if (!$this->_is_user_subscribed_to_hotel($payload->data->userId, $hotel_id)) {
      $this->output->set_status_header(403)->set_output(json_encode(['status' => 'error', 'message' => 'You are not authorized to search for guests in this hotel.']));
      return;
    }

    $guests = $this->Guest_model->search_guests($hotel_id, $search_term);
    $this->output->set_status_header(200)->set_output(json_encode($guests));
  }

  public function create_invoice()
  {
    $payload = $this->_validate_token();
    if (!$payload)
      return;

    $input = json_decode(file_get_contents('php://input'), true);

    // Basic validation
    if (empty($input['booking_id']) || !isset($input['total_amount']) || !isset($input['final_amount'])) {
      $this->output->set_status_header(400)->set_output(json_encode(['status' => 'error', 'message' => 'Booking ID, Total Amount, and Final Amount are required.']));
      return;
    }

    // Authorization check
    $booking = $this->Booking_model->get_booking_by_id($input['booking_id']);
    if (!$booking) {
      $this->output->set_status_header(404)->set_output(json_encode(['status' => 'error', 'message' => 'Booking not found.']));
      return;
    }
    if (!$this->_is_user_subscribed_to_hotel($payload->data->userId, $booking['hotel_id'])) {
      $this->output->set_status_header(403)->set_output(json_encode(['status' => 'error', 'message' => 'You are not authorized to create invoices for this hotel.']));
      return;
    }

    // --- Generate Invoice Number ---
    $business_name = $payload->data->business_name;
    $words = explode(' ', $business_name);
    $prefix = '';
    foreach ($words as $word) {
      $prefix .= strtoupper(substr($word, 0, 1));
    }

    $last_invoice = $this->Invoice_model->get_last_invoice_for_user($prefix, $payload->data->userId);
    $next_number = 1;
    if ($last_invoice && !empty($last_invoice['invoice_number'])) {
      $parts = explode('-', $last_invoice['invoice_number']);
      if (count($parts) > 1) {
        $last_number = (int) end($parts);
        $next_number = $last_number + 1;
      }
    }
    $invoice_number = $prefix . '-' . str_pad($next_number, 5, '0', STR_PAD_LEFT);
    // --- End Generate Invoice Number ---

    $data = [
      'booking_id' => $input['booking_id'],
      'total_amount' => $input['total_amount'],
      'discount' => isset($input['discount']) ? $input['discount'] : 0.00,
      'final_amount' => $input['final_amount'],
      'invoice_number' => $invoice_number,
      'mode_of_payment' => isset($input['mode_of_payment']) ? $input['mode_of_payment'] : null,
      'transaction_number' => isset($input['transaction_number']) ? $input['transaction_number'] : null,
      'vat_percent' => isset($input['vat_percent']) ? $input['vat_percent'] : 0.00,
      'vat_amount' => isset($input['vat_amount']) ? $input['vat_amount'] : 0.00,
      'invoice_date' => date('Y-m-d H:i:s'),
    ];

    $new_invoice = $this->Invoice_model->create_invoice($data);
    if ($new_invoice) {
      $this->output->set_status_header(201)->set_output(json_encode($new_invoice));
    } else {
      $this->output->set_status_header(500)->set_output(json_encode(['status' => 'error', 'message' => 'Failed to create invoice.']));
    }
  }

  public function get_invoices($hotel_id)
  {
    $payload = $this->_validate_token();
    if (!$payload)
      return;

    if (!$this->_is_user_subscribed_to_hotel($payload->data->userId, $hotel_id)) {
      $this->output->set_status_header(403)->set_output(json_encode(['status' => 'error', 'message' => 'You are not authorized to view invoices for this hotel.']));
      return;
    }

    $invoices = $this->Invoice_model->get_invoices_for_hotel($hotel_id);
    $this->output->set_status_header(200)->set_output(json_encode($invoices));
  }

  public function get_invoice_by_booking($booking_id)
  {
    $payload = $this->_validate_token();
    if (!$payload)
      return;

    $booking = $this->Booking_model->get_booking_by_id($booking_id);
    if (!$booking) {
      $this->output->set_status_header(404)->set_output(json_encode(['status' => 'error', 'message' => 'Booking not found.']));
      return;
    }

    if (!$this->_is_user_subscribed_to_hotel($payload->data->userId, $booking['hotel_id'])) {
      $this->output->set_status_header(403)->set_output(json_encode(['status' => 'error', 'message' => 'You are not authorized to view this invoice.']));
      return;
    }

    $invoice = $this->Invoice_model->get_invoice_by_booking_id($booking_id);
    if (!$invoice) {
      $this->output->set_status_header(404)->set_output(json_encode(['status' => 'error', 'message' => 'Invoice not found for this booking.']));
      return;
    }

    $this->output->set_status_header(200)->set_output(json_encode($invoice));
  }

  public function update_invoice()
  {
    $payload = $this->_validate_token();
    if (!$payload)
      return;

    $input = json_decode(file_get_contents('php://input'), true);
    $invoice_id = isset($input['invoice_id']) ? $input['invoice_id'] : null;

    if (!$invoice_id) {
      $this->output->set_status_header(400)->set_output(json_encode(['status' => 'error', 'message' => 'Invoice ID is required.']));
      return;
    }

    $invoice = $this->Invoice_model->get_invoice_by_id($invoice_id);
    if (!$invoice) {
      $this->output->set_status_header(404)->set_output(json_encode(['status' => 'error', 'message' => 'Invoice not found.']));
      return;
    }

    $booking = $this->Booking_model->get_booking_by_id($invoice['booking_id']);
    if (!$this->_is_user_subscribed_to_hotel($payload->data->userId, $booking['hotel_id'])) {
      $this->output->set_status_header(403)->set_output(json_encode(['status' => 'error', 'message' => 'You are not authorized to modify this invoice.']));
      return;
    }

    $data = [];
    $fields = ['total_amount', 'discount', 'final_amount', 'mode_of_payment', 'transaction_number', 'vat_percent', 'vat_amount'];
    foreach ($fields as $field) {
      if (isset($input[$field])) {
        $data[$field] = $input[$field];
      }
    }

    if ($this->Invoice_model->update_invoice($invoice_id, $data)) {
      $this->output->set_status_header(200)->set_output(json_encode(['status' => 'success', 'message' => 'Invoice updated successfully.']));
    } else {
      $this->output->set_status_header(500)->set_output(json_encode(['status' => 'error', 'message' => 'Failed to update invoice.']));
    }
  }

  public function delete_invoice()
  {
    $payload = $this->_validate_token();
    if (!$payload)
      return;

    $input = json_decode(file_get_contents('php://input'), true);
    $invoice_id = isset($input['invoice_id']) ? $input['invoice_id'] : null;

    if (!$invoice_id) {
      $this->output->set_status_header(400)->set_output(json_encode(['status' => 'error', 'message' => 'Invoice ID is required.']));
      return;
    }

    $invoice = $this->Invoice_model->get_invoice_by_id($invoice_id);
    if (!$invoice) {
      $this->output->set_status_header(404)->set_output(json_encode(['status' => 'error', 'message' => 'Invoice not found.']));
      return;
    }

    $booking = $this->Booking_model->get_booking_by_id($invoice['booking_id']);
    if (!$this->_is_user_subscribed_to_hotel($payload->data->userId, $booking['hotel_id'])) {
      $this->output->set_status_header(403)->set_output(json_encode(['status' => 'error', 'message' => 'You are not authorized to delete this invoice.']));
      return;
    }

    if ($this->Invoice_model->delete_invoice($invoice_id)) {
      $this->output->set_status_header(200)->set_output(json_encode(['status' => 'success', 'message' => 'Invoice deleted successfully.']));
    } else {
      $this->output->set_status_header(500)->set_output(json_encode(['status' => 'error', 'message' => 'Failed to delete invoice.']));
    }
  }

  public function add_service()
  {
    $payload = $this->_validate_token();
    if (!$payload)
      return;

    $input = json_decode(file_get_contents('php://input'), true);

    // Basic validation
    if (empty($input['booking_id']) || empty($input['service_id'])) {
      $this->output->set_status_header(400)->set_output(json_encode(['status' => 'error', 'message' => 'Booking ID and Service ID are required.']));
      return;
    }

    // Authorization check
    $booking = $this->Booking_model->get_booking_by_id($input['booking_id']);
    if (!$booking) {
      $this->output->set_status_header(404)->set_output(json_encode(['status' => 'error', 'message' => 'Booking not found.']));
      return;
    }
    if (!$this->_is_user_subscribed_to_hotel($payload->data->userId, $booking['hotel_id'])) {
      $this->output->set_status_header(403)->set_output(json_encode(['status' => 'error', 'message' => 'You are not authorized to add services to this booking.']));
      return;
    }

    $data = [
      'hotel_id' => $booking['hotel_id'],
      'booking_id' => $input['booking_id'],
      'service_id' => $input['service_id'],
    ];

    $new_service = $this->Service_model->add_service($data);
    if ($new_service) {
      $this->output->set_status_header(201)->set_output(json_encode($new_service));
    } else {
      $this->output->set_status_header(500)->set_output(json_encode(['status' => 'error', 'message' => 'Failed to add service.']));
    }
  }

  public function remove_service()
  {
    $payload = $this->_validate_token();
    if (!$payload)
      return;

    $input = json_decode(file_get_contents('php://input'), true);
    $service_id = isset($input['service_id']) ? $input['service_id'] : null;

    if (!$service_id) {
      $this->output->set_status_header(400)->set_output(json_encode(['status' => 'error', 'message' => 'Service ID is required.']));
      return;
    }

    // Authorization check
    $service = $this->Service_model->get_service_by_id($service_id);
    if (!$service) {
      $this->output->set_status_header(404)->set_output(json_encode(['status' => 'error', 'message' => 'Service not found.']));
      return;
    }

    $booking = $this->Booking_model->get_booking_by_id($service['booking_id']);
    if (!$booking) {
      $this->output->set_status_header(404)->set_output(json_encode(['status' => 'error', 'message' => 'Associated booking not found.']));
      return;
    }

    if (!$this->_is_user_subscribed_to_hotel($payload->data->userId, $booking['hotel_id'])) {
      $this->output->set_status_header(403)->set_output(json_encode(['status' => 'error', 'message' => 'You are not authorized to remove this service.']));
      return;
    }

    if ($this->Service_model->delete_service($service_id)) {
      $this->output->set_status_header(200)->set_output(json_encode(['status' => 'success', 'message' => 'Service removed successfully.']));
    } else {
      $this->output->set_status_header(500)->set_output(json_encode(['status' => 'error', 'message' => 'Failed to remove service.']));
    }
  }

  public function get_services($hotel_id)
  {
    $payload = $this->_validate_token();
    if (!$payload)
      return;

    if (!$this->_is_user_subscribed_to_hotel($payload->data->userId, $hotel_id)) {
      $this->output->set_status_header(403)->set_output(json_encode(['status' => 'error', 'message' => 'You are not authorized to view services for this hotel.']));
      return;
    }

    $services = $this->Service_model->get_services_for_hotel($hotel_id);
    $this->output->set_status_header(200)->set_output(json_encode($services));
  }

  public function update_service()
  {
    $payload = $this->_validate_token();
    if (!$payload)
      return;

    $input = json_decode(file_get_contents('php://input'), true);
    $service_id = isset($input['service_id']) ? $input['service_id'] : null;

    if (!$service_id) {
      $this->output->set_status_header(400)->set_output(json_encode(['status' => 'error', 'message' => 'Service ID is required.']));
      return;
    }

    // Authorization check
    $service = $this->Service_model->get_service_by_id($service_id);
    if (!$service) {
      $this->output->set_status_header(404)->set_output(json_encode(['status' => 'error', 'message' => 'Service not found.']));
      return;
    }

    if (!$this->_is_user_subscribed_to_hotel($payload->data->userId, $service['hotel_id'])) {
      $this->output->set_status_header(403)->set_output(json_encode(['status' => 'error', 'message' => 'You are not authorized to modify this service.']));
      return;
    }

    $data = [];
    $fields = ['service', 'date', 'amount'];
    foreach ($fields as $field) {
      if (isset($input[$field])) {
        $data[$field] = $input[$field];
      }
    }

    if (empty($data)) {
      $this->output->set_status_header(400)->set_output(json_encode(['status' => 'error', 'message' => 'No updatable fields provided.']));
      return;
    }

    if ($this->Service_model->update_service($service_id, $data)) {
      $updated_service = $this->Service_model->get_service_by_id($service_id);
      $this->output->set_status_header(200)->set_output(json_encode([
        'status' => 'success',
        'message' => 'Service updated successfully.',
        'service' => $updated_service
      ]));
    } else {
      $this->output->set_status_header(500)->set_output(json_encode(['status' => 'error', 'message' => 'Failed to update service.']));
    }
  }

  public function get_service_types($hotel_id)
  {
    $payload = $this->_validate_token();
    if (!$payload)
      return;

    if (!$this->_is_user_subscribed_to_hotel($payload->data->userId, $hotel_id)) {
      $this->output->set_status_header(403)->set_output(json_encode(['status' => 'error', 'message' => 'You are not authorized to view service types for this hotel.']));
      return;
    }

    $service_types = $this->Service_type_model->get_service_types_for_hotel($hotel_id);
    $this->output->set_status_header(200)->set_output(json_encode($service_types));
  }

  public function create_service_type()
  {
    $payload = $this->_validate_token();
    if (!$payload)
      return;

    $input = json_decode(file_get_contents('php://input'), true);
    if (empty($input['hotel_id']) || empty($input['service']) || !isset($input['price'])) {
      $this->output->set_status_header(400)->set_output(json_encode(['status' => 'error', 'message' => 'Hotel ID, service name, and price are required.']));
      return;
    }

    if (!$this->_is_user_subscribed_to_hotel($payload->data->userId, $input['hotel_id'])) {
      $this->output->set_status_header(403)->set_output(json_encode(['status' => 'error', 'message' => 'You are not authorized to add service types to this hotel.']));
      return;
    }

    $new_service_type = $this->Service_type_model->create_service_type($input);
    if ($new_service_type) {
      $this->output->set_status_header(201)->set_output(json_encode($new_service_type));
    } else {
      $this->output->set_status_header(500)->set_output(json_encode(['status' => 'error', 'message' => 'Failed to create service type.']));
    }
  }

  public function update_service_type()
  {
    $payload = $this->_validate_token();
    if (!$payload)
      return;

    $input = json_decode(file_get_contents('php://input'), true);
    $service_type_id = isset($input['service_type_id']) ? $input['service_type_id'] : null;

    if (!$service_type_id) {
      $this->output->set_status_header(400)->set_output(json_encode(['status' => 'error', 'message' => 'Service Type ID is required.']));
      return;
    }

    $service_type = $this->Service_type_model->get_service_type_by_id($service_type_id);
    if (!$service_type) {
      $this->output->set_status_header(404)->set_output(json_encode(['status' => 'error', 'message' => 'Service type not found.']));
      return;
    }

    if (!$this->_is_user_subscribed_to_hotel($payload->data->userId, $service_type['hotel_id'])) {
      $this->output->set_status_header(403)->set_output(json_encode(['status' => 'error', 'message' => 'You are not authorized to modify this service type.']));
      return;
    }

    $data = [];
    if (isset($input['service']))
      $data['service'] = $input['service'];
    if (isset($input['price']))
      $data['price'] = $input['price'];

    if ($this->Service_type_model->update_service_type($service_type_id, $data)) {
      $this->output->set_status_header(200)->set_output(json_encode(['status' => 'success', 'message' => 'Service type updated successfully.']));
    } else {
      $this->output->set_status_header(500)->set_output(json_encode(['status' => 'error', 'message' => 'Failed to update service type.']));
    }
  }

  public function delete_service_type()
  {
    $payload = $this->_validate_token();
    if (!$payload)
      return;

    $input = json_decode(file_get_contents('php://input'), true);
    $service_type_id = isset($input['service_type_id']) ? $input['service_type_id'] : null;

    if (!$service_type_id) {
      $this->output->set_status_header(400)->set_output(json_encode(['status' => 'error', 'message' => 'Service Type ID is required.']));
      return;
    }

    $service_type = $this->Service_type_model->get_service_type_by_id($service_type_id);
    if (!$this->_is_user_subscribed_to_hotel($payload->data->userId, $service_type['hotel_id'])) {
      $this->output->set_status_header(403)->set_output(json_encode(['status' => 'error', 'message' => 'You are not authorized to delete this service type.']));
      return;
    }

    if ($this->Service_type_model->delete_service_type($service_type_id)) {
      $this->output->set_status_header(200)->set_output(json_encode(['status' => 'success', 'message' => 'Service type deleted successfully.']));
    } else {
      $this->output->set_status_header(500)->set_output(json_encode(['status' => 'error', 'message' => 'Failed to delete service type. It might be in use.']));
    }
  }

  public function get_services_for_booking($booking_id)
  {
    $payload = $this->_validate_token();
    if (!$payload) {
      return;
    }

    // Authorization check
    $booking = $this->Booking_model->get_booking_by_id($booking_id);
    if (!$booking) {
      $this->output->set_status_header(404)->set_output(json_encode(['status' => 'error', 'message' => 'Booking not found.']));
      return;
    }

    if (!$this->_is_user_subscribed_to_hotel($payload->data->userId, $booking['hotel_id'])) {
      $this->output->set_status_header(403)->set_output(json_encode(['status' => 'error', 'message' => 'You are not authorized to view services for this booking.']));
      return;
    }

    // Fetch and return services for the specific booking
    $services = $this->Service_model->get_services_for_booking($booking_id);
    $this->output->set_status_header(200)->set_output(json_encode($services));
  }
}