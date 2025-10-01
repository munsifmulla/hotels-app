<?php
defined('BASEPATH') or exit('No direct script access allowed');

/*
| -------------------------------------------------------------------------
| URI ROUTING
| -------------------------------------------------------------------------
| This file lets you re-map URI requests to specific controller functions.
|
| Typically there is a one-to-one relationship between a URL string
| and its corresponding controller class/method. The segments in a
| URL normally follow this pattern:
|
|	example.com/class/method/id/
|
| In some instances, however, you may want to remap this relationship
| so that a different class/function is called than the one
| corresponding to the URL.
|
| Please see the user guide for complete details:
|
|	https://codeigniter.com/userguide3/general/routing.html
|
| -------------------------------------------------------------------------
| RESERVED ROUTES
| -------------------------------------------------------------------------
|
| There are three reserved routes:
|
|	$route['default_controller'] = 'welcome';
|
| This route indicates which controller class should be loaded if the
| URI contains no data. In the above example, the "welcome" class
| would be loaded.
|
|	$route['404_override'] = 'errors/page_missing';
|
| This route will tell the Router which controller/method to use if those
| provided in the URL cannot be matched to a valid route.
|
|	$route['translate_uri_dashes'] = FALSE;
|
| This is not exactly a route, but allows you to automatically route
| controller and method names that contain dashes. '-' isn't a valid
| class or method name character, so it requires translation.
| When you set this option to TRUE, it will replace ALL dashes in the
| controller and method URI segments.
|
| Examples:	my-controller/index	-> my_controller/index
|		my-controller/my-method	-> my_controller/my_method
*/
$route['default_controller'] = 'welcome';
$route['404_override'] = '';
$route['translate_uri_dashes'] = FALSE;

// API Routes
$route['api/login'] = 'api/login';
$route['api/activate_key'] = 'api/activate_key';
$route['api/hotels'] = 'api/get_hotels';

// API Routes for Room Types
$route['api/room_types/(:num)'] = 'api/get_room_types/$1'; // GET
$route['api/room_types/create'] = 'api/create_room_type'; // POST
$route['api/room_types/update'] = 'api/update_room_type'; // POST
$route['api/room_types/delete'] = 'api/delete_room_type'; // POST

// API Routes for Rooms
$route['api/rooms/create'] = 'api/create_room'; // POST
$route['api/rooms/(:num)'] = 'api/get_rooms/$1'; // GET
$route['api/rooms/update'] = 'api/update_room'; // POST
$route['api/rooms/delete'] = 'api/delete_room'; // POST

// API Routes for Guests
$route['api/guests/create'] = 'api/create_guest'; // POST
$route['api/guests/update'] = 'api/update_guest'; // POST
$route['api/guests/delete'] = 'api/delete_guest'; // POST
$route['api/guests/hotel/(:num)'] = 'api/get_guests_for_hotel/$1'; // GET
$route['api/guests/(:num)'] = 'api/get_guest/$1'; // GET

// API Routes for Bookings
$route['api/bookings/create'] = 'api/create_booking'; // POST
$route['api/bookings/update'] = 'api/update_booking'; // POST
$route['api/bookings/delete'] = 'api/delete_booking'; // POST
$route['api/bookings/hotel/(:num)'] = 'api/get_bookings_for_hotel/$1'; // GET
$route['api/bookings/(:num)'] = 'api/get_booking/$1'; // GET
$route['api/bookings/room/(:num)'] = 'api/get_bookings_for_room/$1'; // GET

// API Routes for Invoices
$route['api/invoices/create'] = 'api/create_invoice'; // POST
$route['api/invoices/update'] = 'api/update_invoice'; // POST
$route['api/invoices/delete'] = 'api/delete_invoice'; // POST
$route['api/invoices/hotel/(:num)'] = 'api/get_invoices/$1'; // GET
$route['api/invoices/booking/(:num)'] = 'api/get_invoice_by_booking/$1'; // GET

// API Routes for Services
$route['api/services/add'] = 'api/add_service'; // POST
$route['api/services/remove'] = 'api/remove_service'; // POST
$route['api/services/hotel/(:num)'] = 'api/get_services/$1'; // GET
$route['api/guests/search/(:num)'] = 'api/search_guests/$1'; // GET with ?q=...

// API Routes for Service Types
$route['api/service_types/hotel/(:num)'] = 'api/get_service_types/$1'; // GET
$route['api/service_types/create'] = 'api/create_service_type'; // POST
$route['api/service_types/update'] = 'api/update_service_type'; // POST
$route['api/service_types/delete'] = 'api/delete_service_type'; // POST
