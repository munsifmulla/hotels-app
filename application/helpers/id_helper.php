<?php
defined('BASEPATH') or exit('No direct script access allowed');

if (!function_exists('generate_unique_id')) {
  function generate_unique_id()
  {
    $combined_id_str = time() . mt_rand(10000, 99999);
    $start = floor(strlen($combined_id_str) / 2) - 5;
    return substr($combined_id_str, $start, 10);
  }
}
