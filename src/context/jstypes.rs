use std::{collections::HashMap, ffi::c_char, os::raw::c_void, ptr};

use super::char_to_string;

pub type JsF32Array = Vec<f32>;

#[no_mangle]
pub extern "C" fn  new_js_f32_array(capacity: i32) -> *mut JsF32Array {
  let v: Box<Vec<f32>> = Box::new(Vec::with_capacity(capacity as usize));
  Box::into_raw(v)
}

#[no_mangle]
pub extern "C" fn js_f32_array_len(arr: *mut JsF32Array) -> u32 {
  unsafe {
    (*arr).len() as u32
  }
}

#[no_mangle]
pub extern "C" fn js_f32_array_get(arr: *mut JsF32Array, index: u32) -> f32 {
  unsafe {
    *(*arr).get(index as usize).unwrap()
  }
}

#[no_mangle]
pub extern "C" fn js_f32_array_set(arr: *mut JsF32Array, index: u32, value: f32) {
  unsafe {
    (*arr)[index as usize] = value
  }
}

#[no_mangle]
pub extern "C" fn js_f32_array_push(arr: *mut JsF32Array, value: f32) {
  unsafe {
    (*arr).push(value)
  }
}

#[no_mangle]
pub extern "C" fn drop_js_f32_array(arr: *mut JsF32Array) {
  unsafe {
    let b = Box::from_raw(arr);
  }
}

pub type JsBuffer = Vec<u8>;

#[no_mangle]
pub extern "C" fn  new_js_buffer(capacity: i32) -> *mut JsBuffer {
  let v = Box::new(Vec::with_capacity(capacity as usize));
  Box::into_raw(v)
}

#[no_mangle]
pub extern "C" fn js_buffer_len(arr: *mut JsBuffer) -> u32 {
  unsafe {
    (*arr).len() as u32
  }
}

#[no_mangle]
pub extern "C" fn js_buffer_get(arr: *mut JsBuffer, index: u32) -> u8 {
  unsafe {
    *(*arr).get(index as usize).unwrap()
  }
}

#[no_mangle]
pub extern "C" fn js_buffer_set(arr: *mut JsBuffer, index: u32, value: u8) {
  unsafe {
    (*arr)[index as usize] = value
  }
}

#[no_mangle]
pub extern "C" fn js_buffer_push(arr: *mut JsBuffer, value: u8) {
  unsafe {
    (*arr).push(value)
  }
}

pub struct ImageData {
  pub data: *mut JsBuffer,
  pub width: f32,
  pub height: f32
}

#[no_mangle]
pub extern "C" fn new_image_data(data: *mut JsBuffer, width: f32, height: f32) -> *mut ImageData {
  Box::into_raw(Box::new(ImageData{data: data, width: width, height}))
}

#[no_mangle]
pub extern "C" fn image_data_get_data(image_data: *mut ImageData) -> *mut JsBuffer {
  unsafe {
    (*image_data).data
  }
}

#[no_mangle]
pub extern "C" fn image_data_get_width(image_data: *mut ImageData) -> f32 {
  unsafe {
    (*image_data).width
  }
}


pub type JsAnyArray = Vec<*mut c_void>;

#[no_mangle]
pub extern "C" fn  new_js_any_array(capacity: i32) -> *mut JsAnyArray {
  let v: Box<JsAnyArray> = Box::new(Vec::with_capacity(capacity as usize));
  Box::into_raw(v)
}

#[no_mangle]
pub extern "C" fn js_any_array_len(arr: *mut JsAnyArray) -> u32 {
  unsafe {
    (*arr).len() as u32
  }
}

#[no_mangle]
pub extern "C" fn js_any_array_get(arr: *mut JsAnyArray, index: u32) -> *mut c_void {
  unsafe {
    *(*arr).get(index as usize).unwrap()
  }
}

#[no_mangle]
pub extern "C" fn js_any_array_set(arr: *mut JsAnyArray, index: u32, value: *mut c_void) {
  unsafe {
    (*arr)[index as usize] = value
  }
}

#[no_mangle]
pub extern "C" fn js_any_array_push(arr: *mut JsAnyArray, value: *mut c_void) {
  unsafe {
    (*arr).push(value)
  }
}

pub type JsStrMap = HashMap<String, String>;

#[no_mangle]
pub extern "C" fn new_js_str_map() -> *mut JsStrMap  {
  let m = Box::new(JsStrMap::new());
  Box::into_raw(m)
}

#[no_mangle]
pub unsafe extern "C" fn js_str_map_insert(m: *mut JsStrMap, k: *mut c_char, v: *mut c_char) {
  (*m).insert(char_to_string(k), char_to_string(v));
}

#[no_mangle]
pub unsafe extern "C" fn js_str_map_delete(m: *mut JsStrMap, k: *mut c_char) -> i32 {
  if (*m).remove(&char_to_string(k)).is_some() {
    1
  } else {
    0
  }
}

#[no_mangle]
pub unsafe extern "C" fn js_str_map_has(m: *mut JsStrMap, k: *mut c_char) -> i32 {
  if (*m).contains_key(&char_to_string(k)) {
    1
  } else {
    0
  }
}

#[no_mangle]
pub unsafe extern "C" fn js_str_map_clear(m: *mut JsStrMap) {
  (*m).clear();
}

#[no_mangle]
pub unsafe extern "C" fn drop_js_str_map(m: *mut JsStrMap) {
  let m =  Box::from_raw(m);
}