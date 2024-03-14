#![allow(clippy::unnecessary_wraps)]
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