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

/// The main function is called by emscripten when the WASM object is created.
fn main() {
    init_gl();
}
