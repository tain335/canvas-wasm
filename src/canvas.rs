#![allow(non_snake_case)]
use std::{cell::RefCell, ffi::c_char, ptr::null_mut};

use skia_safe::{ pdf, ClipOp, Color, ColorSpace, Data, Document, EncodedImageFormat, Image as SkImage, Matrix, Picture, PictureRecorder, Rect, Size, Vector};

use crate::{context::{jstypes::{JsBuffer, JsF32Array}, Context2D}, surface::SurfaceState, utils::{char_to_string, css_to_color}};
pub type BoxedCanvas = RefCell<Canvas>;
use crc::{Crc, CRC_32_ISO_HDLC};
const CRC32: Crc<u32> = Crc::<u32>::new(&CRC_32_ISO_HDLC);

pub struct Canvas{
  pub width: f32,
  pub height: f32,
  pub surface_state: Box<SurfaceState>,
  pub ctx: *mut Context2D,
}

#[no_mangle]
pub unsafe extern "C" fn new_canvas(surface: *mut SurfaceState, width: f32, height: f32) -> *const Canvas {
  let c = Box::new(Canvas{ surface_state: Box::from_raw(surface), width: width, height: height, ctx: null_mut() });
  Box::into_raw(c)
}

#[no_mangle]
pub unsafe extern "C" fn canvas_get_width(c: *mut Canvas) -> f32 {
  (*c).width
}

#[no_mangle]
pub  unsafe extern "C" fn canvas_get_height(c: *mut Canvas) -> f32 {
  (*c).height
}

#[no_mangle]
pub  unsafe extern "C" fn canvas_set_width(c: *mut Canvas, width: f32) {
  (*c).width = width;
}

#[no_mangle]
pub unsafe extern "C" fn canvas_set_height(c: *mut Canvas, height: f32) {
  (*c).height = height;
}

#[no_mangle]
pub unsafe extern "C" fn canvas_save_as(c: *mut Canvas, format: *mut c_char, quality: f32, density: f32,  matte: *mut c_char, background: *mut c_char, cutting: *mut JsF32Array) -> *mut JsBuffer {
  let format = char_to_string(format);
  let matte = css_to_color(&char_to_string(matte));
  let background: Option<Color> = css_to_color(&char_to_string(background));
  match format.as_str() {
    "pdf" => save_to_pdf(&mut (*(*c).ctx), quality, density, matte, background, cutting.as_ref().unwrap().as_slice()),
    "png" | "jpg" | "jpeg" => save_to_image(&mut (*(*c).ctx), format.as_str(), quality, density, matte, background),
    _ => panic!("unsupport format {}", format)
  }
}

fn save_to_pdf(ctx: &mut Context2D, quality:f32, density:f32, matte:Option<Color>, background: Option<Color>, cutting: &[f32]) -> *mut JsBuffer {
  let doc = pdf_document(quality, density);
  let mut  bounds = ctx.bounds;
  let mut source_offset: f32 = 0.0;
  let mut target_offset_top: f32 = 0.0;
  let mut target_offset_right: f32 = 0.0;
  let mut target_offset_bottom: f32 = 0.0;
  let mut target_offset_left: f32 = 0.0;
  if cutting.len() == 7 {
    source_offset = cutting[0];
    target_offset_top = cutting[1];
    target_offset_right = cutting[2];
    target_offset_bottom = cutting[3];
    target_offset_left = cutting[4];
    bounds = Rect::from_xywh(0.0, 0.0, cutting[5], cutting[6]);
  }
  let mut page: Document<skia_safe::document::state::OnPage> = doc.begin_page(bounds.size(), None);
  let doc_canvas = page.canvas();
  let p = ctx.get_picture(matte);
  if let Some(pic) = p {
    if let Some(background) = background {
      doc_canvas.clip_rect(bounds, Some(ClipOp::Intersect), true);
      doc_canvas.clear(background);
    }
    doc_canvas.restore();
    let content_width = bounds.width() - target_offset_left - target_offset_right;
    let content_height = bounds.height() - target_offset_bottom - target_offset_top;
    let scale = content_width / ctx.bounds.width();
    doc_canvas.clip_rect(Rect::from_xywh(target_offset_left, target_offset_top, content_width, content_height), Some(ClipOp::Intersect), true);
    doc_canvas.translate(Vector::new(target_offset_left, -source_offset + target_offset_top));
    doc_canvas.scale((scale, scale));
    doc_canvas.draw_picture(pic, None, None);
  } else {
    panic!("no picture");
  }
  let doc = page.end_page();
  let data = doc.close();
  let bytes = data.as_bytes();
  Box::into_raw(Box::new(Vec::from(bytes)))
}

fn save_to_image(ctx: &mut Context2D, format: &str, quality:f32, density:f32, matte:Option<Color>, background: Option<Color>) -> *mut JsBuffer{
  let pic = if let Some(pic) =  ctx.get_picture(matte) {
    pic
  } else {
    panic!("no picture")
  };
  if ctx.bounds.is_empty(){
    panic!("Width and height must be non-zero to generate an image")
  } else {
    let img_dims = ctx.bounds.size();
    let img_format = match format {
      "jpg" | "jpeg" => Some(EncodedImageFormat::JPEG),
      "png" => Some(EncodedImageFormat::PNG),
      _ => None
    };
    if let Some(img_format) = img_format {
      let img_scale = Matrix::scale((density, density));
      let img_dims = Size::new(img_dims.width * density, img_dims.height * density).to_floor();
      let bounds = Rect::from_wh(img_dims.width as f32, img_dims.height as f32);
      let mut recorder = PictureRecorder::new();
      let canvas = recorder.begin_recording(bounds, None);
      if let Some(background) = background {
        canvas.clear(background);
      }
      let canvas  = canvas
            .set_matrix(&img_scale.into());
        pic.playback(canvas);
        let pic = recorder.finish_recording_as_picture(Some(&bounds));
        let img = SkImage::from_picture(pic.unwrap(), img_dims, None, None, skia_safe::image::BitDepth::U8, Some(ColorSpace::new_srgb())); 
        let data = img.unwrap().encode_to_data_with_quality(img_format, (quality*100.0) as i32).map(|data| with_dpi(data, img_format, density));
        if data.is_some() {
          let data  = data.unwrap();
          let bytes = data.as_bytes();
          Box::into_raw(Box::new(Vec::from(bytes)))
        } else {
          panic!("no data from canvas");
        }
    } else {
      panic!("unsupport format")
    }
  }
}

fn pdf_document(quality:f32, density:f32) -> Document{
  let mut meta = pdf::Metadata::default();
  meta.producer = "Canvas WASM <https://github.com/tain335/canvas-wasm>".to_string();
  meta.encoding_quality = Some((quality*1.0) as i32);
  meta.raster_dpi = Some(density * 72.0);
  pdf::new_document(Some(&meta))
}

fn with_dpi(data:Data, format:EncodedImageFormat, density:f32) -> Data{
  if density as u32 == 1 { return data }

  let mut bytes = data.as_bytes().to_vec();
  match format{
    EncodedImageFormat::JPEG => {
      let [l, r] = (72 * density as u16).to_be_bytes();
      bytes.splice(13..18, [1, l, r, l, r].iter().cloned());
      Data::new_copy(&bytes)
    }
    EncodedImageFormat::PNG => {
      let mut digest = CRC32.digest();
      let [a, b, c, d] = ((72.0 * density * 39.3701) as u32).to_be_bytes();
      let phys = vec![
        b'p', b'H', b'Y', b's',
        a, b, c, d, // x-dpi
        a, b, c, d, // y-dpi
        1, // dots per meter
      ];
      digest.update(&phys);

      let length = 9u32.to_be_bytes().to_vec();
      let checksum = digest.finalize().to_be_bytes().to_vec();
      bytes.splice(33..33, [length, phys, checksum].concat());
      Data::new_copy(&bytes)
    }
    _ => data
  }
}
