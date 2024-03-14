#![allow(unused_variables)]
#![allow(unused_mut)]
#![allow(dead_code)]
#![allow(unused_imports)]
#![allow(non_snake_case)]
// use core::slice::SlicePattern;
use std::ffi::{c_char, c_void, CStr, CString};
use std::{f32::consts::PI, ptr::null};
use std::cell::RefCell;
use skia_safe::{textlayout, Data, RCHandle};
use skia_safe::{Image as SkImage, canvas, Matrix, PaintStyle, Path, PathDirection::{CCW, CW}, Point, RRect, Rect};
use skia_safe::path::AddPathMode::Append;
use skia_safe::path::AddPathMode::Extend;
use skia_safe::textlayout::{ParagraphStyle, TextDirection};
use skia_safe::PaintStyle::{Fill, Stroke};
use skia_safe::path::FillType;

use super::{Context2D, Dye};
use super::jstypes::*;
use crate::canvas::{Canvas, BoxedCanvas};
use crate::path::Path2D;
use crate::image::{Image, BoxedImage};
use crate::filter::{Filter, FilterSpec};
use crate::{typography::*, FONT_LIBRARY};
use crate::utils::*;

pub struct CanvasFilter {
  pub css: String,
  pub specs: Vec<FilterSpec>,
}

//
// The js interface for the Context2D struct
//
#[no_mangle]
pub extern "C" fn new_context(canvas: *mut Canvas) -> *mut Context2D {
  unsafe {
    let mut cx = Box::new(Context2D::new(Box::from_raw(canvas)));
    cx.reset_size(((*canvas).width, (*canvas).height));
    Box::into_raw(cx)
  }
}

#[no_mangle]
pub extern "C" fn resetSize(cx: *mut Context2D, canvas: *mut Canvas) {
  unsafe {
    (*cx).reset_size(((*canvas).width, (*canvas).height));
  }
}

#[no_mangle]
pub extern "C" fn get_size(cx: *mut Context2D) -> *const JsF32Array {
  unsafe {
    let width = (*cx).bounds.size().width;
    let height = (*cx).bounds.size().height;
    let arr = Box::new(vec![width, height]);
    Box::into_raw(arr)
  }
}

#[no_mangle]
pub extern "C" fn set_size(cx: *mut Context2D, arr: *mut JsF32Array) {
  unsafe {
    if let [width, height] = (*arr).as_slice() {
      (*cx).resize((*width, *height));
    }
  }
}
#[no_mangle]
pub extern "C" fn reset(cx: *mut Context2D) {
  unsafe {
    let size = (*cx).bounds.size();
    (*cx).reset_size(size);
  }
}

//
// Grid State
//
#[no_mangle]
pub extern "C" fn save(cx: *mut Context2D) {
  unsafe {
    (*cx).push();
  }
}

#[no_mangle]
pub extern "C" fn restore(cx: *mut Context2D) {
  unsafe {
    (*cx).pop();
  }
}

#[no_mangle]
pub extern "C" fn transform(cx: *mut Context2D, arr: *mut JsF32Array) {
  unsafe {
    if let [m11, m12, m21, m22, dx, dy] = (*arr).as_slice(){
      let matrix = Matrix::new_all(*m11, *m21, *dx, *m12, *m22, *dy, 0.0, 0.0, 1.0);
      (*cx).with_matrix(|ctm| ctm.pre_concat(&matrix) );
    }
  }
}

#[no_mangle]
pub extern "C" fn translate(cx: *mut Context2D, arr: *mut JsF32Array) {
  unsafe {
    if let [dx, dy] = (*arr).as_slice(){
      (*cx).with_matrix(|ctm| ctm.pre_translate((*dx, *dy)) );
    }
  }
}

#[no_mangle]
pub extern "C" fn scale(cx: *mut Context2D, arr: *mut JsF32Array)  {
  unsafe {
    if let [m11, m22] = (*arr).as_slice(){
      (*cx).with_matrix(|ctm| ctm.pre_scale((*m11, *m22), None) );
    }
  }
}

#[no_mangle]
pub extern "C" fn rotate(cx: *mut Context2D, radians: f32)  {
  unsafe {
    let degrees = radians / PI * 180.0;
    (*cx).with_matrix(|ctm| ctm.pre_rotate(degrees, None) );
  }
}

#[no_mangle]
pub extern "C" fn resetTransform(cx: *mut Context2D) {
  unsafe {
    (*cx).with_matrix(|ctm| ctm.reset() );
  }
}

#[no_mangle]
pub extern "C" fn createProjection(cx: *mut Context2D, dstArr: *mut JsF32Array, srcArr: *mut JsF32Array) -> *mut JsF32Array {
  unsafe {
    let mut src = vec![];
    let mut dst = vec![];
    let mut i = 0;
    while i < (*srcArr).len() {
      src.push(Point { x: (*srcArr)[0], y: (*srcArr)[1] });
      i += 2
    }
    i = 0;
    while i < (*dstArr).len() {
      dst.push(Point { x: (*dstArr)[0], y: (*dstArr)[1] });
      i += 2
    }
    let basis:Vec<Point> = match src.len(){
      0 => (*cx).bounds.to_quad().to_vec(), // use canvas dims
      1 => Rect::from_wh(src[0].x, src[0].y).to_quad().to_vec(), // implicit 0,0 origin
      2 => Rect::new(src[0].x, src[0].y, src[1].x, src[1].y).to_quad().to_vec(), // lf/top, rt/bot
      _ => src.clone(),
    };

    let quad:Vec<Point> = match dst.len(){
      1 => Rect::from_wh(dst[0].x, dst[0].y).to_quad().to_vec(), // implicit 0,0 origin
      2 => Rect::new(dst[0].x, dst[0].y, dst[1].x, dst[1].y).to_quad().to_vec(), // lf/top, rt/bot
      _ => dst.clone(),
    };

    match (Matrix::from_poly_to_poly(&basis, &quad), basis.len() == quad.len()){
      (Some(projection), true) => {
        let arr = new_js_f32_array(9);
        for i in 0..9 {
          js_f32_array_push(arr, projection[i as usize])
        }
        arr
      },
      _ => panic!(
        "Expected 2 or 4 x/y points for output quad (got {}) and 0, 1, 2, or 4 points for the coordinate basis (got {})",
        quad.len(), basis.len()
      )
    }
  }
}

// // -- ctm property ----------------------------------------------------------------------
#[no_mangle]
pub extern "C" fn get_currentTransform(cx: *mut Context2D) -> *mut JsF32Array {
  unsafe {
    let arr = new_js_f32_array(9);
    for i in 0..9 {
      js_f32_array_push(arr, (*cx).state.matrix[i as usize])
    }
    arr
  }
}

#[no_mangle]
pub extern "C" fn set_currentTransform(cx: *mut Context2D, arr: *mut JsF32Array) {
  unsafe {
    if let Some(matrix) = to_matrix((*arr).as_slice()){
      (*cx).with_matrix(|ctm| ctm.reset().pre_concat(&matrix) );
    }
  }
}


//
// Bézier Paths
//
#[no_mangle]
pub extern "C" fn beginPath(cx: *mut Context2D) {
  unsafe {
    (*cx).path = Path::new();
  }
}

// -- primitives ------------------------------------------------------------------------
#[no_mangle]
pub extern "C" fn rect(cx: *mut Context2D, arr: *mut JsF32Array) {
  unsafe {
    if let [x, y, w, h] = (*arr).as_slice() {
      let rect = Rect::from_xywh(*x, *y, *w, *h);
      let quad = (*cx).state.matrix.map_rect_to_quad(rect);
      (*cx).path.move_to(quad[0]);
      (*cx).path.line_to(quad[1]);
      (*cx).path.line_to(quad[2]);
      (*cx).path.line_to(quad[3]);
      (*cx).path.close();
    }
  }
}

#[no_mangle]
pub extern "C" fn roundRect(cx: *mut Context2D, arr: *mut JsF32Array) {
  unsafe {
    let nums = (*arr).as_slice();
    if let [x, y, w, h] = &nums[..4]{
      let rect = Rect::from_xywh(*x, *y, *w, *h);
      let radii:Vec<Point> = nums[4..].chunks(2).map(|xy| Point::new(xy[0], xy[1])).collect();
      let rrect = RRect::new_rect_radii(rect, &[radii[0], radii[1], radii[2], radii[3]]);
      let direction = if w.signum() == h.signum(){ CW }else{ CCW };
      (*cx).path.add_rrect(rrect, Some((direction, 0)));
    }
  }
}

#[no_mangle]
pub extern "C" fn arc(cx: *mut Context2D, arr: *mut JsF32Array) {
  unsafe {
    let nums = &(*arr).as_slice()[1..6];
    let ccwVal = (*arr).get(6);
    let mut ccw = false;
    if let Some(c) = ccwVal {
      if *c == 1.0 {
        ccw = true
      }
    }
    if let [x, y, radius, start_angle, end_angle] = nums {
      let matrix = (*cx).state.matrix;
      let mut arc = Path2D::new();
      arc.add_ellipse((*x, *y), (*radius, *radius), 0.0, *start_angle, *end_angle, ccw);
      (*cx).path.add_path(&arc.path.with_transform(&matrix), (0,0), Extend);
    }
  }
}

#[no_mangle]
pub extern "C" fn ellipse(cx: *mut Context2D, arr: *mut JsF32Array) {
  unsafe { 
    let nums = &(*arr).as_slice()[1..8];
    let ccwVal = (*arr).get(8);
    let mut ccw = false;
    if let Some(c) = ccwVal {
      if *c == 1.0 {
        ccw = true
      }
    }
    if let [x, y, x_radius, y_radius, rotation, start_angle, end_angle] = nums {
      if *x_radius < 0.0 || *y_radius < 0.0 {
        panic!("radii cannot be negative")
      }
      let matrix = (*cx).state.matrix;
      let mut arc = Path2D::new();
      arc.add_ellipse((*x, *y), (*x_radius, *y_radius), *rotation, *start_angle, *end_angle, ccw);
      (*cx).path.add_path(&arc.path.with_transform(&matrix), (0,0), Extend);
    }
  }
}

// contour drawing ----------------------------------------------------------------------
#[no_mangle]
pub extern "C" fn moveTo(cx: *mut Context2D, arr: *mut JsF32Array) {
  unsafe {
    let xy = (*arr).as_slice();
    if let Some(dst) = (*cx).map_points(&xy).first(){
      (*cx).path.move_to(*dst);
    }
  }
}

#[no_mangle]
pub extern "C" fn lineTo(cx: *mut Context2D, arr: *mut JsF32Array) {
  unsafe {
    let xy = (*arr).as_slice();
    if let Some(dst) = (*cx).map_points(&xy).first(){
      if (*cx).path.is_empty(){ (*cx).path.move_to(*dst); }
      (*cx).path.line_to(*dst);
    }
  }
}

#[no_mangle]
pub extern "C" fn arcTo(cx: *mut Context2D, arr: *mut JsF32Array) {
  unsafe {
    let coords = &(*arr).as_slice()[1..5];
    let radius = (*arr).get(5);
    if let Some(radius) = radius {
      if let [src, dst] = (*cx).map_points(&coords).as_slice(){
        if (*cx).path.is_empty(){ (*cx).path.move_to(*src); }
        (*cx).path.arc_to_tangent(*src, *dst, *radius);
      }
    }
  }
}

#[no_mangle]
pub extern "C" fn bezierCurveTo(cx: *mut Context2D, arr: *mut JsF32Array) {
  unsafe {
    let coords = (*arr).as_slice();
    if let [cp1, cp2, dst] = (*cx).map_points(&coords).as_slice(){
      if (*cx).path.is_empty(){ (*cx).path.move_to(*cp1); }
      (*cx).path.cubic_to(*cp1, *cp2, *dst);
    }
  }
}

#[no_mangle]
pub extern "C" fn quadraticCurveTo(cx: *mut Context2D, arr: *mut JsF32Array) {
  unsafe {
    let coords = (*arr).as_slice();
    if let [cp, dst] = (*cx).map_points(&coords).as_slice(){
      if (*cx).path.is_empty(){ (*cx).path.move_to(*cp); }
      (*cx).path.quad_to(*cp, *dst);
    }
  }
}

#[no_mangle]
pub extern "C" fn conicCurveTo(cx: *mut Context2D, arr: *mut JsF32Array) {
  unsafe {
    let coords = &(*arr).as_slice()[1..5];
    let weight = (*arr).get(5);
    if let Some(weight) = weight {
      if let [src, dst] = (*cx).map_points(&coords).as_slice(){
        if (*cx).path.is_empty(){ (*cx).path.move_to((src.x, src.y)); }
        (*cx).path.conic_to((src.x, src.y), (dst.x, dst.y), *weight);
      }
    }
  }
}

#[no_mangle]
pub extern "C" fn closePath(cx: *mut Context2D) {
  unsafe {
    (*cx).path.close();
  }
}

// hit testing --------------------------------------------------------------------------
#[no_mangle]
pub extern "C" fn isPointInPath(cx: *mut Context2D, path: *mut Path2D, x: f32, y:f32, rule: u32) -> u32 {
  _is_in(cx, path, x, y, rule, Fill)
}

#[no_mangle]
pub extern "C" fn isPointInStroke(cx: *mut Context2D, path: *mut Path2D, x: f32, y:f32, rule: u32) -> u32 {
  _is_in(cx, path, x, y, rule, Stroke)
}

fn _is_in(cx: *mut Context2D, mut path: *mut Path2D, x: f32, y:f32, rule: u32, ink:PaintStyle) -> u32 {
  unsafe {
    let rule_type = if rule == 0 {  FillType::Winding } else { FillType::EvenOdd };
    let mut target = if !path.is_null() {
      (*path).path.clone()
    } else {
      (*cx).path.clone()
    };
    let is_in = match ink{
      Stroke => (*cx).hit_test_path(&mut target, (x, y), None, Stroke),
      _ => (*cx).hit_test_path(&mut target, (x, y), Some(rule_type), Fill)
    };
    if is_in {
      1 as u32
    } else {
      0 as u32
    }
  }
}

// masking ------------------------------------------------------------------------------
#[no_mangle]
pub extern "C" fn clip(cx: *mut Context2D, path: *mut Path2D, rule: u32) {
  unsafe {
    let rule_type = if rule == 0 {  FillType::Winding } else { FillType::EvenOdd };
    let mut target = if !path.is_null() {
      Some((*path).path.clone())
    } else {
      None
    };
    (*cx).clip_path(target, rule_type);
  }
}


//
// Fill & Stroke
//
#[no_mangle]
pub extern "C" fn fill(cx: *mut Context2D, path: *mut Path2D, rule: u32) {
  unsafe {
    let rule_type = if rule == 0 {  FillType::Winding } else { FillType::EvenOdd };
    let mut target = if !path.is_null() {
      Some((*path).path.clone())
    } else {
      None
    };
    (*cx).draw_path(target, PaintStyle::Fill, Some(rule_type));
  }
}

#[no_mangle]
pub extern "C" fn stroke(cx: *mut Context2D, path: *mut Path2D) {
  unsafe {
    let mut target = if !path.is_null() {
      Some((*path).path.clone())
    } else {
      None
    };
    (*cx).draw_path(target, PaintStyle::Stroke, None);
  }
}

#[no_mangle]
pub extern "C" fn fillRect(cx: *mut Context2D, arr: *mut JsF32Array) {
  unsafe {
    let nums = &(*arr).as_slice()[0..4];
    if let [x, y, w, h] = nums {
      let rect = Rect::from_xywh(*x, *y, *w, *h);
      let path = Path::rect(rect, None);
      (*cx).draw_path(Some(path), PaintStyle::Fill, None);
    }
  }
}

#[no_mangle]
pub extern "C" fn strokeRect(cx: *mut Context2D, arr: *mut JsF32Array) {
  unsafe {
    let nums = &(*arr).as_slice()[1..5];
    if let [x, y, w, h] = nums {
      let rect = Rect::from_xywh(*x, *y, *w, *h);
      let path = Path::rect(rect, None);
      (*cx).draw_path(Some(path), PaintStyle::Stroke, None);
    }
  }
}

#[no_mangle]
pub extern "C" fn clearRect(cx: *mut Context2D, arr: *mut JsF32Array) {
  unsafe {
    let nums = &(*arr).as_slice()[1..5];
    if let [x, y, w, h] = nums {
      let rect = Rect::from_xywh(*x, *y, *w, *h);
      (*cx).clear_rect(&rect);
    }
  }
}


// fill & stoke properties --------------------------------------------------------------
#[no_mangle]
pub extern "C" fn get_fillStyle(cx: *mut Context2D) -> *mut Dye {
  unsafe {
    let dye = Box::new((*cx).state.fill_style.clone());
    Box::into_raw(dye)
  }
}

#[no_mangle]
pub extern "C" fn set_fillStyle(cx: *mut Context2D, dye: *mut Dye) {
  unsafe {
    (*cx).state.fill_style = (*dye).clone();
  }
}

#[no_mangle]
pub extern "C" fn get_strokeStyle(cx: *mut Context2D) -> *mut Dye {
  unsafe {
    let dye = Box::new((*cx).state.stroke_style.clone());
    Box::into_raw(dye)
  }
}

#[no_mangle]
pub extern "C" fn set_strokeStyle(cx: *mut Context2D, dye: *mut Dye) {
  unsafe {
    (*cx).state.stroke_style = (*dye).clone();
  }
}

//
// Line Style
//
#[no_mangle]
pub extern "C" fn set_lineDashMarker(cx: *mut Context2D, path: *mut Path2D) {
  unsafe {
    (*cx).state.line_dash_marker = if path.is_null() { None } else {  Some((*path).path.clone()) };
  }
}

#[no_mangle]
pub extern "C" fn get_lineDashMarker(cx: *mut Context2D) -> *const Path2D {
  unsafe {
    match &(*cx).state.line_dash_marker {
      Some(marker) => Box::into_raw(Box::new(Path2D{path:marker.clone()})),
      None => null()
    }
}
}

#[no_mangle]
pub extern "C" fn set_lineDashFit(cx: *mut Context2D, style: *mut c_char) {
  unsafe {
    let style_str = char_to_string(style);

    if let Some(fit) = to_1d_style(&style_str){
      (*cx).state.line_dash_fit = fit;
    }
  }
}

#[no_mangle]
pub extern "C" fn get_lineDashFit(cx: *mut Context2D) -> *mut c_char {
  unsafe {
    let fit = from_1d_style((*cx).state.line_dash_fit);
    string_to_char(fit)
  }
}

#[no_mangle]
pub extern "C" fn getLineDash(cx: *mut Context2D) -> *mut JsF32Array {
  unsafe {
    let dashes = (*cx).state.line_dash_list.clone();
    Box::into_raw(Box::new(dashes))
  }
}

#[no_mangle]
pub extern "C" fn setLineDash(cx: *mut Context2D, arr: *mut JsF32Array) {
  unsafe {
    let mut intervals = (*arr).iter().cloned()
      .filter(|n| *n >= 0.0 && n.is_finite())
      .collect::<Vec<f32>>();

    if (*arr).len() == intervals.len(){
      if intervals.len() % 2 == 1{
        intervals.append(&mut intervals.clone());
      }

      (*cx).state.line_dash_list = intervals
    }
  }
}


// line style properties  -----------------------------------------------------------
#[no_mangle]
pub extern "C" fn get_lineCap(cx: *mut Context2D) -> *mut c_char {
  unsafe {
    let mode = (*cx).state.paint.stroke_cap();
    let name = from_stroke_cap(mode);
    string_to_char(name)
  }
}

#[no_mangle]
pub extern "C" fn set_lineCap(cx: *mut Context2D, line_cap: *mut c_char) {
  unsafe {
    let name = char_to_string(line_cap);
  
    if let Some(mode) = to_stroke_cap(&name){
      (*cx).state.paint.set_stroke_cap(mode);
    }
  }
}

#[no_mangle]
pub extern "C" fn get_lineDashOffset(cx: *mut Context2D) -> f32 {
  
  unsafe {
    let num = (*cx).state.line_dash_offset;
    num
  }
}

#[no_mangle]
pub extern "C" fn set_lineDashOffset(cx: *mut Context2D, num: f32) {
  unsafe {
    (*cx).state.line_dash_offset = num;
  }
}

#[no_mangle]
pub extern "C" fn get_lineJoin(cx: *mut Context2D) -> *mut c_char {
  unsafe {
    let mode = (*cx).state.paint.stroke_join();
    let name = from_stroke_join(mode);
    string_to_char(name)
  }
}

#[no_mangle]
pub extern "C" fn set_lineJoin(cx: *mut Context2D, line_join: *mut c_char) {
  unsafe {
    let name = char_to_string(line_join);

    if let Some(mode) = to_stroke_join(&name){
      (*cx).state.paint.set_stroke_join(mode);
    }
  }
}

#[no_mangle]
pub extern "C" fn get_lineWidth(cx: *mut Context2D) -> f32 {
  unsafe {
    let num = (*cx).state.paint.stroke_width();
    num
  }
}

#[no_mangle]
pub extern "C" fn set_lineWidth(cx: *mut Context2D, num: f32) {
  unsafe {
    if num > 0.0 {
      (*cx).state.paint.set_stroke_width(num);
      (*cx).state.stroke_width = num;
    }
  }
}

#[no_mangle]
pub extern "C" fn get_miterLimit(cx: *mut Context2D) -> f32 {
  unsafe {
    let num = (*cx).state.paint.stroke_miter();
    num
  }
}

#[no_mangle]
pub extern "C" fn set_miterLimit(cx: *mut Context2D, num: f32) {
  unsafe {
    if num > 0.0 {
      (*cx).state.paint.set_stroke_miter(num);
    }
  }
}

//
// Imagery
//

fn _layout_rects(width:f32, height:f32, nums:&[f32]) -> Option<(Rect, Rect)> {
  let (src, dst) = match nums.len() {
    2 => ( Rect::from_xywh(0.0, 0.0, width, height),
           Rect::from_xywh(nums[0], nums[1], width, height) ),
    4 => ( Rect::from_xywh(0.0, 0.0, width, height),
           Rect::from_xywh(nums[0], nums[1], nums[2], nums[3]) ),
    8 => ( Rect::from_xywh(nums[0], nums[1], nums[2], nums[3]),
           Rect::from_xywh(nums[4], nums[5], nums[6], nums[7]) ),
    _ => return None
  };
  Some((src, dst))
}

fn _drawImage(cx: *mut Context2D, image: Option<SkImage>, arr: *mut JsF32Array)  {
  unsafe {
    let dims = image.as_ref().map(|img|
      (img.width(), img.height())
    );
    let (width, height) = match dims{
      Some((w,h)) => (w as f32, h as f32),
      None => panic!("Cannot draw incomplete image (has it finished loading?)")
    };
    let nums = (*arr).as_slice();
    match _layout_rects(width, height, &nums){
      Some((src, dst)) => {
        // shrink src to lie within the image bounds and adjust dst proportionately
        let (src, dst) = fit_bounds(width, height, src, dst);
        (*cx).draw_image(&image, &src, &dst);
      },
      None => panic!("Expected 2, 4, or 8 coordinates (got {})", nums.len())
    }
  }
}

#[no_mangle]
pub extern "C" fn get_image(cx: *mut Context2D) -> *mut Image {
  unsafe {
    Box::into_raw(Box::new(Image{ image: (*cx).get_image()}))
  }
}

#[no_mangle]
pub extern "C" fn drawImage(cx: *mut Context2D, image: *mut Image, arr: *mut JsF32Array) {
  unsafe {
    _drawImage(cx, (*image).image.clone(), arr)
  }
}

#[no_mangle]
pub extern "C" fn drawImageFromContext(cx: *mut Context2D, context: *mut Context2D, arr: *mut JsF32Array) {
  unsafe {
    _drawImage(cx, (*context).get_image(), arr)
  }
}

#[no_mangle]
pub extern "C" fn drawImageFromBuffer(cx: *mut Context2D, buffer: *mut JsBuffer, arr: *mut JsF32Array) {
  unsafe {
    let data = Data::new_copy((*buffer).as_slice());
    let image = SkImage::from_encoded(data);
    _drawImage(cx, image, arr)
  }
}

#[no_mangle]
pub extern "C" fn drawCanvas(cx: *mut Context2D, ctx: *mut Context2D, arr: *mut JsF32Array) {
  unsafe {

    let (width, height) = {
      let bounds = (*ctx).bounds;
      (bounds.width(), bounds.height())
    };
    let nums = (*arr).as_slice();
    match _layout_rects(width, height, &nums){
      Some((src, dst)) => {
        let pict = (*ctx).get_picture();
        (*cx).draw_picture(&pict, &src, &dst);
      },
      None => panic!("Expected 2, 4, or 8 coordinates (got {})", nums.len())
    }
  }
}

#[no_mangle]
pub extern "C" fn getImageData(cx: *mut Context2D, x: i32, y: i32, width: i32, height: i32) -> *mut JsBuffer {
  unsafe {
    let mut buffer: Box<Vec<u8>> = Box::new(Vec::with_capacity(4 * (width * height) as usize));
    (*cx).get_pixels(buffer.as_mut().as_mut_slice(), (x, y), (width, height));

    Box::into_raw(buffer)
  }
}

#[no_mangle]
pub extern "C" fn putImageData(cx: *mut Context2D, image_data_ptr: *mut ImageData, arr: *mut JsF32Array) {
  // determine geometry
  unsafe {
    let width = (*image_data_ptr).width;
    let height = (*image_data_ptr).height;
    let x = js_f32_array_get(arr, 0);
    let y = js_f32_array_get(arr, 1);

    if js_f32_array_len(arr) > 2 && js_f32_array_len(arr) != 6 {
      panic!("expected either 2 or 6 numbers")
    }

    let (mut src, mut dst) = match (*arr).as_mut_slice(){
      [_, _, dx, dy, dw, dh] => {
        if *dw < 0.0 { *dw *= -1.0; *dx -= *dw; }
        if *dh < 0.0 { *dh *= -1.0; *dy -= *dh; }
        (Rect::from_xywh(*dx, *dy, *dw, *dh), Rect::from_xywh(*dx + x, *dy + y, *dw, *dh))
      },
      _ => (
        Rect::from_xywh(0.0, 0.0, width, height),
        Rect::from_xywh(x, y, width, height)
    )};

    let info = Image::info(width, height);
    (*cx).blit_pixels((*(*image_data_ptr).data).as_slice(), &info, &src, &dst);
   
  }
}

// -- image properties --------------------------------------------------------------
#[no_mangle]
pub extern "C" fn get_imageSmoothingEnabled(cx: *mut Context2D) -> u32 {
  unsafe {      
    if (*cx).state.image_filter.smoothing {
      1
    } else {
      0
    }
  }
}

#[no_mangle]
pub extern "C" fn set_imageSmoothingEnabled(cx: *mut Context2D, smoothing: u32) {
  unsafe {
    let flag = smoothing == 1;
    (*cx).state.image_filter.smoothing = flag;
  }
}

#[no_mangle]
pub extern "C" fn get_imageSmoothingQuality(cx: *mut Context2D) -> *mut c_char {
  unsafe {
    let mode = from_filter_quality((*cx).state.image_filter.quality);
    string_to_char(mode)
  }
}

#[no_mangle]
pub extern "C" fn set_imageSmoothingQuality(cx: *mut Context2D, quality: *mut c_char) {
  unsafe {
    let name = char_to_string(quality);

    if let Some(mode) = to_filter_quality(&name){
      (*cx).state.image_filter.quality = mode;
    }
  }
}

//
// Typography
//
// 实现富文本绘制方法
#[no_mangle]
pub unsafe extern "C" fn drawRichText(cx: *mut Context2D, text: *mut c_char, arr: *mut JsF32Array) {
  let mut style = ParagraphStyle::new();
  style.set_ellipsis("...");
  style.set_max_lines(2);
  let mut builder = textlayout::ParagraphBuilder::new(&style, &FONT_LIBRARY.lock().unwrap().collection);
  builder.push_style(&(*cx).state.char_style);
  builder.add_text(char_to_string(text));
  let mut paragraph = builder.build();
  paragraph.layout(100.0);
  (*cx).with_canvas(|canvas| {
    paragraph.paint(canvas, (100, 100));
  });
}

#[no_mangle]
pub extern "C" fn fillText(cx: *mut Context2D, text: *mut c_char, arr: *mut JsF32Array) {
  _draw_text(cx, Fill, text, arr)
}

#[no_mangle]
pub extern "C" fn strokeText(cx: *mut Context2D, text: *mut c_char, arr: *mut JsF32Array) {
  _draw_text(cx, Stroke, text, arr)
}

fn _draw_text(cx: *mut Context2D, style:PaintStyle, text: *mut c_char, arr: *mut JsF32Array) {
  unsafe {
    let text =  char_to_string(text);
    let x = js_f32_array_get(arr, 0);
    let y = js_f32_array_get(arr, 1);
    let width = if js_f32_array_len(arr) > 2 { Some(js_f32_array_get(arr, 2)) } else { None };
    (*cx).draw_text(&text, x, y, width, style);
  }
}

#[no_mangle]
pub extern "C" fn measureText(cx: *mut Context2D, text: *mut c_char, arr: *mut JsF32Array) -> *mut JsAnyArray {
  unsafe {
    let text =  char_to_string(text);
    let width = if js_f32_array_len(arr) == 1 { Some(js_f32_array_get(arr, 0))}  else { None };
    let text_metrics = (*cx).measure_text(&text, width);

    let results = new_js_any_array(10);
    for (i, info) in text_metrics.iter().enumerate(){
      let line = new_js_f32_array(11);
      for (_, v) in info.iter().enumerate() {
        js_f32_array_push(line, *v)
      }
      js_any_array_push(results, line as *mut c_void)
    }
    results
  }
}

#[no_mangle]
pub extern "C" fn outlineText(cx: *mut Context2D, text: *mut c_char) -> *const Path2D {
  unsafe {
    let text =  char_to_string(text);
    if let Some(path) = (*cx).outline_text(&text){
      Box::into_raw(Box::new(Path2D{path}))
    }else{
      null()
    }
  }
}

// -- type properties ---------------------------------------------------------------
#[no_mangle]
pub extern "C" fn get_font(cx: *mut Context2D) -> *mut c_char {
  unsafe {
    let font = (*cx).state.font.clone();
    string_to_char(font)
  }
}

#[no_mangle]
pub extern "C" fn set_font(cx: *mut Context2D, spec: *mut FontSpec) {
  unsafe {
    if !spec.is_null() {
      (*cx).set_font((*spec).clone());
    }
  }
}

#[no_mangle]
pub extern "C" fn get_textAlign(cx: *mut Context2D) -> *mut c_char {
  unsafe {
    let mode = from_text_align((*cx).state.graf_style.text_align());
    string_to_char(mode)
  }
}

#[no_mangle]
pub extern "C" fn set_textAlign(cx: *mut Context2D, text_align: *mut c_char) {
  unsafe {
    let name = char_to_string(text_align);

    if let Some(mode) = to_text_align(&name){
      (*cx).state.graf_style.set_text_align(mode);
    }
  }
}

#[no_mangle]
pub extern "C" fn get_textBaseline(cx: *mut Context2D) -> *mut c_char {
  unsafe {
    let mode = from_text_baseline((*cx).state.text_baseline);
    string_to_char(mode)
  }
}

#[no_mangle]
pub extern "C" fn set_textBaseline(cx: *mut Context2D, text_baseline: *mut c_char) {
  unsafe {
    let name = char_to_string(text_baseline);

    if let Some(mode) = to_text_baseline(&name){
      (*cx).state.text_baseline = mode;
    }
  }
}

#[no_mangle]
pub extern "C" fn get_direction(cx: *mut Context2D) -> *mut c_char {
  unsafe {
    let name = match (*cx).state.graf_style.text_direction(){
      TextDirection::LTR => "ltr",
      TextDirection::RTL => "rtl",
    };
    string_to_char(name.to_owned())
  }
}

#[no_mangle]
pub extern "C" fn set_direction(cx: *mut Context2D, direction: *mut c_char) {
  unsafe {
    let name = char_to_string(direction);
    let direction = match name.to_lowercase().as_str(){
      "ltr" => Some(TextDirection::LTR),
      "rtl" => Some(TextDirection::RTL),
      _ => None
    };

    if let Some(dir) = direction{
      (*cx).state.graf_style.set_text_direction(dir);
    }
  }
}

//
// Effects
//

// -- compositing properties --------------------------------------------------------
#[no_mangle]
pub extern "C" fn get_globalAlpha(cx: *mut Context2D) -> f32 {
  unsafe {
    (*cx).state.global_alpha
  }
}

#[no_mangle]
pub extern "C" fn set_globalAlpha(cx: *mut Context2D, global_alpha: f32) {
  unsafe {
    (*cx).state.global_alpha = global_alpha;
  }
}

#[no_mangle]
pub extern "C" fn get_globalCompositeOperation(cx: *mut Context2D) -> *mut c_char {
  unsafe {
    let mode = from_blend_mode((*cx).state.global_composite_operation);
    string_to_char(mode)
  }
}

#[no_mangle]
pub extern "C" fn set_globalCompositeOperation(cx: *mut Context2D, glboal_composite_operation: *mut c_char) {
  unsafe {
    let name = CStr::from_ptr(glboal_composite_operation).to_string_lossy().into_owned();
    if let Some(mode) = to_blend_mode(&name){
      (*cx).state.global_composite_operation = mode;
      (*cx).state.paint.set_blend_mode(mode);
    }
  }
}

// -- css3 filters ------------------------------------------------------------------
#[no_mangle]
pub extern "C" fn get_filter(cx: *mut Context2D) -> *mut c_char {
  unsafe {
    let filter = (*cx).state.filter.to_string();
    string_to_char(filter)
  }
}

#[no_mangle]
pub extern "C" fn set_filter(cx: *mut Context2D, filter: *mut CanvasFilter) {
  unsafe {
    let filter_text = (*filter).css.clone();
    let specs = (*filter).specs.clone();
    if filter_text != (*cx).state.filter.to_string() {
      (*cx).state.filter = Filter::new(&filter_text, &specs);
    }
  }
}

// -- dropshadow properties ---------------------------------------------------------
#[no_mangle]
pub extern "C" fn get_shadowBlur(cx: *mut Context2D) -> f32 {
  unsafe {
    (*cx).state.shadow_blur
  }
}

#[no_mangle]
pub extern "C" fn set_shadowBlur(cx: *mut Context2D, shadow_blur: f32) {
  unsafe {  
    (*cx).state.shadow_blur = shadow_blur;
  }
}

#[no_mangle]
pub extern "C" fn get_shadowColor(cx: *mut Context2D) -> *mut c_char {
  unsafe {
    let shadow_color = (*cx).state.shadow_color;
    let css_str = color_to_css(&shadow_color).unwrap_or("".to_string());
    string_to_char(css_str)
  }
}

#[no_mangle]
pub extern "C" fn set_shadowColor(cx: *mut Context2D, color: *mut c_char) {
  unsafe {
    let color_str = char_to_string(color);
   
    if let Some(color) =  css_to_color(&color_str) {
      (*cx).state.shadow_color = color;
    }
  }
}

#[no_mangle]
pub extern "C" fn get_shadowOffsetX(cx: *mut Context2D) -> f32 {
  unsafe {
    (*cx).state.shadow_offset.x
  }
}

#[no_mangle]
pub extern "C" fn get_shadowOffsetY(cx: *mut Context2D) -> f32 {
  unsafe {
    (*cx).state.shadow_offset.y
  }
}

#[no_mangle]
pub extern "C" fn set_shadowOffsetX(cx: *mut Context2D, offet_x: f32) {
  unsafe {
    (*cx).state.shadow_offset.x = offet_x;
  }
}

#[no_mangle]
pub extern "C" fn set_shadowOffsetY(cx: *mut Context2D, offet_y: f32) {
  unsafe {
    (*cx).state.shadow_offset.y = offet_y;
  }
}