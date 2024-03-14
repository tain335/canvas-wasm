#![allow(unused_mut)]
#![allow(unused_imports)]
#![allow(unused_variables)]
#![allow(non_snake_case)]
#![allow(dead_code)]
use std::cell::RefCell;
use std::ffi::c_char;
use std::sync::{Arc, Mutex};
use skia_safe::{Shader, TileMode, TileMode::{Decal, Repeat}, SamplingOptions, Size,
                Image as SkImage, Picture, Matrix, FilterMode};

use crate::context::jstypes::{ImageData, JsF32Array};
use crate::context::Context2D;
use crate::utils::*;
use crate::image::{BoxedImage, Image};
use crate::filter::ImageFilter;

pub struct Stamp{
  image:Option<SkImage>,
  pict:Option<Picture>,
  dims:Size,
  repeat:(TileMode, TileMode),
  matrix:Matrix
}

#[derive(Clone)]
pub struct CanvasPattern{
  pub stamp:Arc<Mutex<Stamp>>
}

impl CanvasPattern{
  pub fn shader(&self, image_filter: ImageFilter) -> Option<Shader>{
    let stamp = Arc::clone(&self.stamp);
    let stamp = stamp.lock().unwrap();

    if let Some(image) = &stamp.image{
      image.to_shader(stamp.repeat, image_filter.sampling(), None).map(|shader|
        shader.with_local_matrix(&stamp.matrix)
      )
    }else if let Some(pict) = &stamp.pict{
      let shader = pict.to_shader(stamp.repeat, FilterMode::Linear, None, None);
      Some(shader.with_local_matrix(&stamp.matrix))
    }else{
      None
    }
  }
}

#[no_mangle]
pub unsafe extern "C" fn new_canvas_pattern_from_image(image: *mut Image, repetition: *mut c_char) -> *mut CanvasPattern {
  let repetition = char_to_string(repetition);
  if let Some(repeat) = to_repeat_mode(&repetition) {
    let  dims = (*image).size();
    let stamp = Stamp{
      image: (*image).image.clone(),
      pict:None,
      dims,
      repeat,
      matrix:Matrix::new_identity()
    };
    let stamp = Arc::new(Mutex::new(stamp));
    Box::into_raw(Box::new(CanvasPattern{stamp}))
  } else {
    panic!("Unknown pattern repeat style")
  }
}

#[no_mangle]
pub unsafe extern "C" fn new_canvas_pattern_from_canvas(cx: *mut Context2D, repetition: *mut c_char) -> *mut CanvasPattern {
  let repetition = char_to_string(repetition);
  if let Some(repeat) = to_repeat_mode(&repetition) {
    let dims = (*cx).bounds.size();
    let stamp = Stamp{
      image:None,
      pict:(*cx).get_picture(),
      dims,
      repeat,
      matrix:Matrix::new_identity()
    };
    let stamp = Arc::new(Mutex::new(stamp));
    Box::into_raw(Box::new(CanvasPattern{stamp}))
  } else {
    panic!("Unknown pattern repeat style")
  }
}

#[no_mangle]
pub unsafe extern "C" fn canvas_pattern_set_transform(cp: *mut CanvasPattern, arr: *mut JsF32Array) {
  if let Some(matrix) =  to_matrix((*arr).as_slice()) {
    let stamp = Arc::clone(&(*cp).stamp);
    let mut stamp = stamp.lock().unwrap();
    stamp.matrix = matrix;
  }
}