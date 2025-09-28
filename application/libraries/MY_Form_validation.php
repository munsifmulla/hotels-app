<?php
defined('BASEPATH') or exit('No direct script access allowed');

class MY_Form_validation extends CI_Form_validation
{

  public function __construct($rules = array())
  {
    parent::__construct($rules);
  }

  /**
   * Is Unique
   *
   * Check if the input value doesn't already exist
   * in the specified database field.
   * This version is modified to allow an ignore clause.
   *
   * @param   string  $str
   * @param   string  $field
   * @return  bool
   */
  public function is_unique($str, $field)
  {
    if (sscanf($field, '%[^.].%[^.].%[^.].%[^.]', $table, $field, $ignore_field, $ignore_value) === 4) {
      $this->CI->db->where($ignore_field . ' !=', $ignore_value);
    }

    return parent::is_unique($str, $table . '.' . $field);
  }
}