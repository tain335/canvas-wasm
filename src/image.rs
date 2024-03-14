#![allow(unused_mut)]
#![allow(unused_imports)]
#![allow(unused_variables)]
#![allow(dead_code)]
use std::{cell::RefCell, ffi::c_char};
// use neon::{prelude::*, types::buffer::TypedArray};
use skia_safe::{Image as SkImage, ImageInfo, Size, ColorType, AlphaType, Data};

use crate::{context::jstypes::JsBuffer, utils::*};

pub type BoxedImage = RefCell<Image>;
// impl Finalize for Image {}

pub struct Image{
  // src: String,
  pub image: Option<SkImage>
}

impl Image{
  pub fn info(width:f32, height:f32) -> ImageInfo {
    let dims = (width as i32, height as i32);
    ImageInfo::new(dims, ColorType::RGBA8888, AlphaType::Unpremul, None)
  }

  pub fn size(&self) -> Size{
    if let Some(img) = &self.image {
      let width = &img.width();
      let height = &img.height();
      Size::new(*width as f32, *height as f32)
    }else{
      Size::new(0.0, 0.0)
    }
  }
}

#[no_mangle]
pub extern "C" fn new_image() -> *mut Image {
  Box::into_raw(Box::new(Image{ image:None }))
}

#[no_mangle]
pub extern "C" fn image_set_data(image: *mut Image, buffer: *mut JsBuffer) -> u32 {
  unsafe {
    let data = Data::new_copy((*buffer).as_slice());
    (*image).image = SkImage::from_encoded(data);
    if (*image).image.is_some() {
      1
    } else {
      0
    }
  }
}

#[no_mangle]
pub extern "C" fn image_get_width(image: *mut Image) -> f32 {
  unsafe {
    (*image).size().width
  }
}

#[no_mangle]
pub extern "C" fn image_get_height(image: *mut Image) -> f32 {
  unsafe {
    (*image).size().height
  }
}