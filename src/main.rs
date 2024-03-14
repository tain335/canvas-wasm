use context::{jstypes::JsBuffer};
use skia_safe::{ ColorSpace, Data, Image, PictureRecorder, Rect};
use surface::SurfaceState;
use std::{boxed::Box, ffi::{c_char, CStr, CString}};

use once_cell::sync::Lazy;
use std::sync::{Mutex};

mod typography;
mod utils;
mod filter;
mod path;
mod context;
mod gradient;
mod image;
mod pattern;
mod texture;
mod canvas;
mod surface;

use typography::FontLibrary;

pub static FONT_LIBRARY: Lazy<Mutex<FontLibrary>> = Lazy::new(|| FontLibrary::shared() );

extern "C" {
  pub fn emscripten_GetProcAddress(
    name: *const ::std::os::raw::c_char,
  ) -> *const ::std::os::raw::c_void;
}



/// Load GL functions pointers from JavaScript so we can call OpenGL functions from Rust.
///
/// This only needs to be done once.
fn init_gl() {
    unsafe {
        gl::load_with(|addr| {
            let addr = std::ffi::CString::new(addr).unwrap();
            emscripten_GetProcAddress(addr.into_raw() as *const _) as *const _
        });
    }
}


// fn render_circle(surface: &mut Surface, x: f32, y: f32, radius: f32) {
//     let mut paint = Paint::default();
//     paint.set_style(PaintStyle::Fill);
//     paint.set_color(Color::BLACK);
//     paint.set_anti_alias(true);
//     surface.canvas().draw_circle((x, y), radius, &paint);
// }


#[no_mangle]
pub unsafe extern "C" fn test_draw_image(state: *mut SurfaceState, buffer: *mut JsBuffer) -> * mut PictureRecorder {
    let state = unsafe { state.as_mut() }.expect("got an invalid state pointer");
    // let mut paint = Paint::default();
    let buffer = Box::from_raw(buffer);
    let data = Data::new_copy(buffer.as_ref());
    let image = Image::from_encoded(data);
    println!("width: {:?}, height: {:?}", image.as_ref().unwrap().width(),  image.as_ref().unwrap().height());
    let bounds = Rect::from_wh(500.0, 500.0);
    let mut rec = Box::new(PictureRecorder::new());
    rec.begin_recording(bounds, None);
    rec.recording_canvas().unwrap().save(); // start at depth 2
    // state.surface.canvas().draw_image(image.unwrap(), (0, 0), None);
    let canvas = rec.recording_canvas();
    let canvas = canvas.unwrap();
    canvas.draw_image(image.unwrap(), (0, 0), None);
    let p = Box::into_raw(rec);
    println!("rec {:p}", p);
    p
    // Box::into_raw(rec)
    // let picture = rec.finish_recording_as_picture(Some(&bounds));
    // if let Some(pict) = picture {
    //    let img = Image::from_picture(pict, bounds.size().to_floor(), None, None, skia_safe::image::BitDepth::U8, Some(ColorSpace::new_srgb()));
    //   state.surface.canvas().draw_image(img.unwrap(), (0, 0), None);
    // }
    // state.surface.canvas().draw_image(picture.unwrap(), (0, 0), None);
    // state.surface.canvas().draw_image(image.unwrap(), (0, 0), None);
    // (*state).surface.flush();
    // state
    // .gpu_state
    // .context
    // .flush_and_submit_surface(&mut state.surface, None);
}

#[no_mangle]
pub unsafe extern "C" fn test_draw_image_flush(state: *mut SurfaceState, rec: * mut PictureRecorder) {
  let mut state = Box::from_raw(state);
  let bounds = Rect::from_wh(500.0, 500.0);
  println!("flush rec {:p}", rec);
  let mut rec = Box::from_raw(rec);
  let picture = rec.finish_recording_as_picture(Some(&bounds));
  if let Some(pict) = picture {
      let img = Image::from_picture(pict, bounds.size().to_floor(), None, None, skia_safe::image::BitDepth::U8, Some(ColorSpace::new_srgb()));
    state.surface.canvas().draw_image(img.unwrap(), (0, 0), None);
  } else {
    panic!("no pic")
  }
  (*state).surface.flush();
}

// #[no_mangle]
// pub extern "C" fn test_string(input: *const c_char) -> *mut c_char {
//     let input_str = unsafe {
//         CStr::from_ptr(input)
//             .to_string_lossy()
//             .into_owned()
//     };
//     // let c_str_ref: &CStr = unsafe { &*s };
//     println!("rust: {}", input_str);
//     CString::new("world").unwrap().into_raw()
// }

// #[no_mangle]
// pub extern  "C" fn test_arr(input: *mut i32, len: usize) {
//     let data = unsafe {
//         Vec::from_raw_parts(input, len, len)
//     };
//     for value in data {
//         println!("Received element: {}", value);
//     }
// }

/// Draw a black circle at the specified coordinates.
// #[no_mangle]
// pub extern "C" fn draw_circle(state: *mut State, x: i32, y: i32) {
//     let state = unsafe { state.as_mut() }.expect("got an invalid state pointer");
//     //state.surface.canvas().clear(Color::WHITE);
//     render_circle(&mut state.surface, x as f32, y as f32, 50.);
//     state.surface.flush();
// }

/// The main function is called by emscripten when the WASM object is created.
fn main() {
    init_gl();
}
