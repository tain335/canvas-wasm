#![allow(unused_variables)]
#![allow(unused_mut)]
#![allow(dead_code)]
#![allow(unused_imports)]
use std::ffi::{CStr, CString};
use std::{cmp, os::raw::c_char};
use std::f32::consts::PI;
use core::ops::Range;
use css_color::Rgba;
use skia_safe::{
  Path, Matrix, Point, Color, Color4f, RGB, Rect, FontArguments,
  font_style::{FontStyle, Weight, Width, Slant},
  font_arguments::{VariationPosition, variation_position::{Coordinate}}
};


//
// meta-helpers
//

fn arg_num(o:usize) -> String{
  // let n = (o + 1) as i32; // we're working with zero-bounded idxs
  let n = o; // arg 0 is always self, so no need to increment the idx
  let ords = ["st","nd","rd"];
  let slot = ((n+90)%100-10)%10 - 1;
  let suffix = if (0..=2).contains(&slot) { ords[slot as usize] } else { "th" };
  format!("{}{}", n, suffix)
}

pub fn almost_equal(a: f32, b: f32) -> bool{
  (a-b).abs() < 0.00001
}

pub fn to_degrees(radians: f32) -> f32{
  radians / PI * 180.0
}

pub fn to_radians(degrees: f32) -> f32{
  degrees / 180.0 * PI
}

/// Convert from byte-indices to char-indices for a given UTF-8 string
pub fn string_idx_range(text: &str, start_idx: usize, end_idx: usize) -> Range<usize> {
  let mut indices = text.char_indices();
  let obtain_index = |(index, _char)| index;
  let str_len = text.len();

  Range{
    start: indices.nth(start_idx).map_or(str_len, &obtain_index),
    end: indices.nth((end_idx - start_idx).max(1) - 1).map_or(str_len, &obtain_index),
  }
}


//
// Colors
//
pub fn css_to_color<'a>(css:&str) -> Option<Color> {
  css.parse::<Rgba>().ok().map(|Rgba{red, green, blue, alpha}|
    Color::from_argb(
      (alpha*255.0).round() as u8,
      (red*255.0).round() as u8,
      (green*255.0).round() as u8,
      (blue*255.0).round() as u8,
    )
  )
}

pub fn color_to_css(color:&Color) -> Result<String, ()> {
  let RGB {r, g, b} = color.to_rgb();
  let css = match color.a() {
    255 => format!("#{:02x}{:02x}{:02x}", r, g, b),
    _ => {
      let alpha = format!("{:.3}", color.a() as f32 / 255.0);
      let alpha = alpha.trim_end_matches('0');
      format!("rgba({}, {}, {}, {})", r, g, b, if alpha=="0."{ "0" } else{ alpha })
    }
  };
  Ok(css)
}

//
// Matrices
//

pub fn to_matrix(t:&[f32]) -> Option<Matrix>{
  match t.len(){
    6 => Some(Matrix::new_all(t[0], t[1], t[2], t[3], t[4], t[5], 0.0, 0.0, 1.0)),
    9 => Some(Matrix::new_all(t[0], t[1], t[2], t[3], t[4], t[5], t[6], t[7], t[8])),
    _ => None
  }
}

pub fn string_to_char(str: String) -> *mut c_char {
  CString::new(str).unwrap().into_raw()
}

pub fn char_to_string(c: *mut c_char) -> String {
  unsafe {
    CStr::from_ptr(c)
      .to_string_lossy()
      .into_owned()
  }
}

pub fn to_filter_quality(mode_name:&str) -> Option<FilterQuality>{
  let mode = match mode_name.to_lowercase().as_str(){
    "low" => FilterQuality::Low,
    "medium" => FilterQuality::Medium,
    "high" => FilterQuality::High,
    _ => return None
  };
  Some(mode)
}

pub fn from_filter_quality(mode:FilterQuality) -> String{
  match mode{
    FilterQuality::Low => "low",
    FilterQuality::Medium => "medium",
    FilterQuality::High => "high",
    _ => "low"
  }.to_string()
}


//
// Skia Enums
//

use skia_safe::{TileMode, TileMode::{Decal, Repeat}};
pub fn to_repeat_mode(repeat:&str) -> Option<(TileMode, TileMode)> {
  let mode = match repeat.to_lowercase().as_str() {
    "repeat" | "" => (Repeat, Repeat),
    "repeat-x" => (Repeat, Decal),
    "repeat-y" => (Decal, Repeat),
    "no-repeat" => (Decal, Decal),
    _ => return None
  };
  Some(mode)
}

use skia_safe::{PaintCap};
pub fn to_stroke_cap(mode_name:&str) -> Option<PaintCap>{
  let mode = match mode_name.to_lowercase().as_str(){
    "butt" => PaintCap::Butt,
    "round" => PaintCap::Round,
    "square" => PaintCap::Square,
        _ => return None
  };
  Some(mode)
}

pub fn from_stroke_cap(mode:PaintCap) -> String{
  match mode{
    PaintCap::Butt => "butt",
    PaintCap::Round => "round",
    PaintCap::Square => "square",
  }.to_string()
}

use skia_safe::{PaintJoin};
pub fn to_stroke_join(mode_name:&str) -> Option<PaintJoin>{
  let mode = match mode_name.to_lowercase().as_str(){
    "miter" => PaintJoin::Miter,
    "round" => PaintJoin::Round,
    "bevel" => PaintJoin::Bevel,
    _ => return None
  };
  Some(mode)
}

pub fn from_stroke_join(mode:PaintJoin) -> String{
  match mode{
    PaintJoin::Miter => "miter",
    PaintJoin::Round => "round",
    PaintJoin::Bevel => "bevel",
  }.to_string()
}


use skia_safe::{BlendMode};
pub fn to_blend_mode(mode_name:&str) -> Option<BlendMode>{
  let mode = match mode_name.to_lowercase().as_str(){
    "source-over" => BlendMode::SrcOver,
    "destination-over" => BlendMode::DstOver,
    "copy" => BlendMode::Src,
    "destination" => BlendMode::Dst,
    "clear" => BlendMode::Clear,
    "source-in" => BlendMode::SrcIn,
    "destination-in" => BlendMode::DstIn,
    "source-out" => BlendMode::SrcOut,
    "destination-out" => BlendMode::DstOut,
    "source-atop" => BlendMode::SrcATop,
    "destination-atop" => BlendMode::DstATop,
    "xor" => BlendMode::Xor,
    "lighter" => BlendMode::Plus,
    "multiply" => BlendMode::Multiply,
    "screen" => BlendMode::Screen,
    "overlay" => BlendMode::Overlay,
    "darken" => BlendMode::Darken,
    "lighten" => BlendMode::Lighten,
    "color-dodge" => BlendMode::ColorDodge,
    "color-burn" => BlendMode::ColorBurn,
    "hard-light" => BlendMode::HardLight,
    "soft-light" => BlendMode::SoftLight,
    "difference" => BlendMode::Difference,
    "exclusion" => BlendMode::Exclusion,
    "hue" => BlendMode::Hue,
    "saturation" => BlendMode::Saturation,
    "color" => BlendMode::Color,
    "luminosity" => BlendMode::Luminosity,
    _ => return None
  };
  Some(mode)
}

pub fn from_blend_mode(mode:BlendMode) -> String{
  match mode{
    BlendMode::SrcOver => "source-over",
    BlendMode::DstOver => "destination-over",
    BlendMode::Src => "copy",
    BlendMode::Dst => "destination",
    BlendMode::Clear => "clear",
    BlendMode::SrcIn => "source-in",
    BlendMode::DstIn => "destination-in",
    BlendMode::SrcOut => "source-out",
    BlendMode::DstOut => "destination-out",
    BlendMode::SrcATop => "source-atop",
    BlendMode::DstATop => "destination-atop",
    BlendMode::Xor => "xor",
    BlendMode::Plus => "lighter",
    BlendMode::Multiply => "multiply",
    BlendMode::Screen => "screen",
    BlendMode::Overlay => "overlay",
    BlendMode::Darken => "darken",
    BlendMode::Lighten => "lighten",
    BlendMode::ColorDodge => "color-dodge",
    BlendMode::ColorBurn => "color-burn",
    BlendMode::HardLight => "hard-light",
    BlendMode::SoftLight => "soft-light",
    BlendMode::Difference => "difference",
    BlendMode::Exclusion => "exclusion",
    BlendMode::Hue => "hue",
    BlendMode::Saturation => "saturation",
    BlendMode::Color => "color",
    BlendMode::Luminosity => "luminosity",
    _ => "source-over"
  }.to_string()
}

use skia_safe::{PathOp};
pub fn to_path_op(op_name:&str) -> Option<PathOp> {
  let op = match op_name.to_lowercase().as_str() {
    "difference" => PathOp::Difference,
    "intersect" => PathOp::Intersect,
    "union" => PathOp::Union,
    "xor" => PathOp::XOR,
    "reversedifference" | "complement" => PathOp::ReverseDifference,
    _ => return None
  };
  Some(op)
}

use skia_safe::path_1d_path_effect;
pub fn to_1d_style(mode_name:&str) -> Option<path_1d_path_effect::Style>{
  let mode = match mode_name.to_lowercase().as_str(){
    "move" => path_1d_path_effect::Style::Translate,
    "turn" => path_1d_path_effect::Style::Rotate,
    "follow" => path_1d_path_effect::Style::Morph,
    _ => return None
  };
  Some(mode)
}

pub fn from_1d_style(mode:path_1d_path_effect::Style) -> String{
  match mode{
    path_1d_path_effect::Style::Translate => "move",
    path_1d_path_effect::Style::Rotate => "turn",
    path_1d_path_effect::Style::Morph => "follow"
  }.to_string()
}

use skia_safe::path::FillType;

use crate::filter::FilterQuality;

pub fn fill_rule_from_string(rule: &str) -> Option<FillType>{
  let rule = match rule {
    "nonzero" => FillType::Winding,
    "evenodd" => FillType::EvenOdd,
    _ => {
      return None;
    }
  };
  Some(rule)
}

//
// Image Rects
//

pub fn fit_bounds(width: f32, height: f32, src: Rect, dst: Rect) -> (Rect, Rect) {
  let mut src = src;
  let mut dst = dst;
  let scale_x = dst.width() / src.width();
  let scale_y = dst.height() / src.height();

  if src.left < 0.0 {
    dst.left += -src.left * scale_x;
    src.left = 0.0;
  }

  if src.top < 0.0 {
    dst.top += -src.top * scale_y;
    src.top = 0.0;
  }

  if src.right > width{
    dst.right -= (src.right - width) * scale_x;
    src.right = width;
  }

  if src.bottom > height{
    dst.bottom -= (src.bottom - height) * scale_y;
    src.bottom = height;
  }

  (src, dst)
}

