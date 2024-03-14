#![allow(unused_mut)]
#![allow(unused_imports)]
#![allow(unused_variables)]
#![allow(non_snake_case)]
#![allow(dead_code)]
use std::{cell::RefCell, ffi::c_char};
use std::f32::consts::PI;
use skia_safe::wrapper::NativeTransmutableWrapper;
use skia_safe::{Path, Point, PathDirection::{CW, CCW}, Rect, RRect, PathOp, StrokeRec,};
use skia_safe::{native_transmutable, scalar, trim_path_effect, Matrix, PathEffect};
use skia_safe::path::{self, AddPathMode, Verb, FillType};

use crate::context::jstypes::{js_f32_array_push, new_js_f32_array, JsF32Array};
use crate::utils::*;

pub struct Path2D {
  pub path:Path
}

impl Path2D{
  pub fn new() -> Self{
    Self{ path:Path::new() }
  }

  pub fn scoot(&mut self, x: f32, y: f32){
    if self.path.is_empty(){
      self.path.move_to((x, y));
    }
  }

  pub fn add_ellipse(&mut self, origin:impl Into<Point>, radii:impl Into<Point>, rotation: f32, start_angle:f32, end_angle:f32, ccw:bool){
    let Point{x, y} = origin.into();
    let Point{x:x_radius, y:y_radius} = radii.into();

    // based off of CanonicalizeAngle in Chrome
    let tau = 2.0 * PI;
    let mut new_start_angle = start_angle % tau;
    if new_start_angle < 0.0 {
      new_start_angle += tau;
    }
    let delta = new_start_angle - start_angle;
    let start_angle = new_start_angle;
    let mut end_angle = end_angle + delta;

    // Based off of AdjustEndAngle in Chrome.
    if !ccw && (end_angle - start_angle) >= tau {
      end_angle = start_angle + tau; // Draw complete ellipse
    } else if ccw && (start_angle - end_angle) >= tau {
      end_angle = start_angle - tau; // Draw complete ellipse
    } else if !ccw && start_angle > end_angle {
      end_angle = start_angle + (tau - (start_angle - end_angle) % tau);
    } else if ccw && start_angle < end_angle {
      end_angle = start_angle - (tau - (end_angle - start_angle) % tau);
    }

    // Based off of Chrome's implementation in
    // https://cs.chromium.org/chromium/src/third_party/blink/renderer/platform/graphics/path.cc
    // of note, can't use addArc or addOval because they close the arc, which
    // the spec says not to do (unless the user explicitly calls closePath).
    // This throws off points being in/out of the arc.
    let oval = Rect::new(x - x_radius, y - y_radius, x + x_radius, y + y_radius);
    let mut rotated = Matrix::new_identity();
    rotated
      .pre_translate((x, y))
      .pre_rotate(to_degrees(rotation), None)
      .pre_translate((-x, -y));
    let unrotated = rotated.invert().unwrap();

    self.path.transform(&unrotated);

    // draw in 2 180 degree segments because trying to draw all 360 degrees at once
    // draws nothing.
    let sweep_deg = to_degrees(end_angle - start_angle);
    let start_deg = to_degrees(start_angle);
    if almost_equal(sweep_deg.abs(), 360.0) {
      let half_sweep = sweep_deg/2.0;
      self.path.arc_to(oval, start_deg, half_sweep, false);
      self.path.arc_to(oval, start_deg + half_sweep, half_sweep, false);
    }else{
      self.path.arc_to(oval, start_deg, sweep_deg, false);
    }

    self.path.transform(&rotated);
  }
}

#[no_mangle]
pub extern "C" fn new_path2d() -> *mut Path2D {
  Box::into_raw(Box::new(Path2D { path: Path::new() }))
}


#[no_mangle]
pub extern "C" fn new_path2d_form_svg(svg_path: *mut c_char) -> *mut Path2D {
  let svg_str = char_to_string(svg_path);
  let path = Path::from_svg(svg_str).unwrap_or_else(Path::new);
  Box::into_raw(Box::new(Path2D { path: path }))
}


#[no_mangle]
pub extern "C" fn new_path2d_from_path(path: *mut Path2D) -> *mut Path2D {
  unsafe {
    let path = Box::from_raw(path).path.clone();
    Box::into_raw(Box::new(Path2D { path: path }))
  }
}

#[no_mangle]
pub extern "C" fn path2d_add_path(path: *mut Path2D, other: *mut Path2D, transform: *mut Matrix) {
  unsafe {
    let transform = if transform.is_null() { Matrix::new_identity() } else { *Box::from_raw(transform) };

    // make a copy if adding a path to itself, otherwise use a ref
    if path == other {
      let src = (*other).path.clone();
      let mut dst = &mut (*path).path;
      dst.add_path_matrix(&src, &transform, AddPathMode::Append);
    }else{
      let src = &(*other).path;
      let mut dst = &mut (*path).path;
      dst.add_path_matrix(src, &transform, AddPathMode::Append);
    };
  }
}

#[no_mangle]
pub extern "C" fn path2d_close_path(path: *mut Path2D) {
  unsafe {
    (*path).path.close();
  }
}

#[no_mangle]
pub extern "C" fn path2d_move_to(path: *mut Path2D, x: f32, y: f32) {
  unsafe {
    (*path).path.move_to(Point{x: x, y: y});
  }
}

#[no_mangle]
pub extern "C" fn path2d_line_to(path: *mut Path2D, x: f32, y: f32) {
  unsafe {
    (*path).path.line_to(Point{x: x, y: y});
  }
}

#[no_mangle]
pub extern "C" fn path2d_bezier_curve_to(path: *mut Path2D, arr: *mut JsF32Array) {
  unsafe {
    if let [cp1x, cp1y, cp2x, cp2y, x, y] = (*arr).as_slice() {
      (*path).scoot(*cp1x, *cp1y);
      (*path).path.cubic_to((*cp1x, *cp1y), (*cp2x, *cp2y), (*x, *y));
    }
  }
}

#[no_mangle]
pub extern "C" fn path2d_quadratic_curve_to(path: *mut Path2D, arr: *mut JsF32Array) {
  unsafe {
    if let [cpx, cpy, x, y] = (*arr).as_slice(){
      (*path).scoot(*cpx, *cpy);
      (*path).path.quad_to((*cpx, *cpy), (*x, *y));
    }
  }
}

#[no_mangle]
pub extern "C" fn path2d_conic_curve_to(path: *mut Path2D, arr: *mut JsF32Array) {
  unsafe {
    if let [p1x, p1y, p2x, p2y, weight] = (*arr).as_slice(){
      (*path).scoot(*p1x, *p1y);
      (*path).path.conic_to((*p1x, *p1y), (*p2x, *p2y), *weight);
    }
  }
}

#[no_mangle]
pub extern "C" fn path2d_arc(path: *mut Path2D, arr: *mut JsF32Array) {
  unsafe {
    if let [x, y, radius, start_angle, end_angle, ccw] = (*arr).as_slice(){ 
      (*path).add_ellipse((*x, *y), (*radius, *radius), 0.0, *start_angle, *end_angle, *ccw == 1.0);
    }
  }
}

#[no_mangle]
pub extern "C" fn path2d_arc_to(path: *mut Path2D, arr: *mut JsF32Array) {
  unsafe {
    if let [x1, y1, x2, y2, radius] = (*arr).as_slice(){
      (*path).scoot(*x1, *y1);
      (*path).path.arc_to_tangent((*x1, *y1), (*x2, *y2), *radius);
    }
  }
}

#[no_mangle]
pub extern "C" fn path2d_ellipse(path: *mut Path2D, arr: *mut JsF32Array) {
  unsafe {
    if let [x, y, x_radius, y_radius, rotation, start_angle, end_angle, ccw] = (*arr).as_slice(){ 
      (*path).add_ellipse((*x, *y), (*x_radius, *y_radius), *rotation, *start_angle, *end_angle, *ccw == 1.0);
    }
  }
}

#[no_mangle]
pub extern "C" fn path2d_rect(path: *mut Path2D, arr: *mut JsF32Array) {
  unsafe {
    if let [x, y, w, h] = (*arr).as_slice(){
      let rect = Rect::from_xywh(*x, *y, *w, *h);
      let direction = if w.signum() == h.signum(){ CW }else{ CCW };
      (*path).path.add_rect(rect, Some((direction, 0)));
    }
  }
}

#[no_mangle]
pub extern "C" fn path2d_round_rect(path: *mut Path2D, arr: *mut JsF32Array) {
  unsafe {
    if let [x, y, w, h] = (*arr).as_slice()[..4]{
      let rect = Rect::from_xywh(x, y, w, h);
      let radii:Vec<Point> = (*arr).as_slice()[4..].chunks(2).map(|xy| Point::new(xy[0], xy[1])).collect();
      let rrect = RRect::new_rect_radii(rect, &[radii[0], radii[1], radii[2], radii[3]]);
      let direction = if w.signum() == h.signum(){ CW }else{ CCW };
      (*path).path.add_rrect(rrect, Some((direction, 0)));
    }
  }
}

#[no_mangle]
pub extern "C" fn path2d_op(path: *mut Path2D, other_path: *mut Path2D, op: *mut c_char) -> *mut Path2D {
  unsafe {
    let op_name = char_to_string(op);
    if let Some(path_op) = to_path_op(&op_name){
      match (*path).path.op(&(*other_path).path, path_op) {
        Some(path) => Box::into_raw(Box::new(Path2D{ path })),
        None => panic!("path operation failed")
      }
    }else{
      panic!("pathOp must be Difference, Intersect, Union, XOR, or Complement")
    }
  }
}

#[no_mangle]
pub extern "C" fn path2d_interpolate(path: *mut Path2D, other_path: *mut Path2D, weight: f32) -> *mut Path2D {
  unsafe {
    if let Some(path) = (*other_path).path.interpolate(&(*path).path, weight){
      Box::into_raw(Box::new(Path2D{ path }))
    }else{
      panic!("Can only interpolate between two Path2D objects with the same number of points and control points")
    }
  }
}

#[no_mangle]
pub extern "C" fn path2d_simplify(path: *mut Path2D, rule: *mut c_char) -> *mut Path2D {
  unsafe {
    let rule = if rule.is_null() { "nonzero".to_owned() } else { char_to_string(rule) };
    let r = fill_rule_from_string(&rule);
    (*path).path.set_fill_type(r.unwrap());
    let new_path = Box::new(Path2D{
      path:match (*path).path.simplify(){
        Some(simpler) => simpler,
        None => (*path).path.clone()
      }
    });
    Box::into_raw(new_path)
  }
}

#[no_mangle]
pub extern "C" fn path2d_unwind(path: *mut Path2D) -> *mut Path2D {
  unsafe {
    (*path).path.set_fill_type(FillType::EvenOdd);
    Box::into_raw(Box::new(Path2D{
      path:match (*path).path.as_winding(){
        Some(rewound) => rewound,
        None => (*path).path.clone()
      }
    }))
  }
}

#[no_mangle]
pub extern "C" fn path2d_offset(path: *mut Path2D, dx: f32, dy: f32) -> *mut Path2D {
  unsafe {
    let path = (*path).path.with_offset((dx, dy));
    Box::into_raw(Box::new(Path2D{path}))
  }
}

#[no_mangle]
pub extern "C" fn path2d_transform(path: *mut Path2D, matrix: *mut Matrix) -> *mut Path2D {
  unsafe {
    let path = (*path).path.with_transform(&(*matrix));
    Box::into_raw(Box::new(Path2D{path}))
  }
}

#[no_mangle]
pub extern "C" fn path2d_round(path: *mut Path2D, radius: f32) -> *mut Path2D {
  unsafe {
    let bounds = (*path).path.bounds();
    let stroke_rec = StrokeRec::new_hairline();

    if let Some(rounder) = PathEffect::corner_path(radius){
      if let Some((path, _)) = rounder.filter_path(&(*path).path, &stroke_rec, bounds){
        return Box::into_raw(Box::new(Path2D{path}))
      }
    }

    Box::into_raw(Box::new(Path2D{path: (*path).path.clone()}))
  }
}

#[no_mangle]
pub extern "C" fn path2d_trim(path: *mut Path2D, begin: f32, end: f32, invert: f32) -> *mut Path2D {
  unsafe {
    let invert = invert == 1.0;

    let bounds = (*path).path.bounds();
    let stroke_rec = StrokeRec::new_hairline();
    let mode = if invert{ trim_path_effect::Mode::Inverted }else{ trim_path_effect::Mode::Normal };

    if let Some(trimmer) = PathEffect::trim(begin, end, mode){
      if let Some((path, _)) = trimmer.filter_path(&(*path).path, &stroke_rec, bounds){
        return Box::into_raw(Box::new(Path2D{path}))
      }
    }

    Box::into_raw(Box::new(Path2D{path: (*path).path.clone()}))
  }
}

#[no_mangle]
pub extern "C" fn path2d_jitter(path: *mut Path2D, seg_len: f32, std_dev: f32, seed: f32) -> *mut Path2D {
  unsafe {
    let seed = seed as u32;
    let bounds = (*path).path.bounds();
    let stroke_rec = StrokeRec::new_hairline();

    if let Some(trimmer) = PathEffect::discrete(seg_len, std_dev, Some(seed)){
      if let Some((path, _)) = trimmer.filter_path(&(*path).path, &stroke_rec, bounds){
        return Box::into_raw(Box::new(Path2D{path}))
      }
    }

    Box::into_raw(Box::new(Path2D{path: (*path).path.clone()}))
  }
}

#[no_mangle]
pub extern "C" fn path2d_bounds(path: *mut Path2D) -> *mut JsF32Array {
  unsafe {

    let b = match (*path).path.tight_bounds(){
      Some(rect) => rect,
      None => (*path).path.compute_tight_bounds()
    };

    let mut arr = new_js_f32_array(6);
    js_f32_array_push(arr, b.left);
    js_f32_array_push(arr, b.top);
    js_f32_array_push(arr, b.right);
    js_f32_array_push(arr, b.bottom);
    js_f32_array_push(arr, b.width());
    js_f32_array_push(arr, b.height());
    arr
  }
}
#[no_mangle]
pub extern "C" fn path2d_contains(path: *mut Path2D, x: f32, y: f32) -> i32 {
  unsafe {
    let mut path = Box::from_raw(path);
    if path.path.contains((x,y)) {
      1
    } else {
      0
    }
  }
}

#[no_mangle]
pub extern "C" fn path2d_get_d(path: *mut Path2D) -> *mut c_char {
  unsafe {
    let mut path = Box::from_raw(path);
    string_to_char(path.path.to_svg())
  }
}

#[no_mangle]
pub extern "C" fn path2d_set_d(path: *mut Path2D, svg_path: *mut c_char) {
  unsafe {
    let mut p = Box::from_raw(path);
    let svg_string = char_to_string(svg_path);
    if let Some(path) = Path::from_svg(svg_string){
      p.path.rewind();
      p.path.add_path(&path, (0,0), None);
    }else{
      panic!("Expected a valid SVG path string")
    }
  }
}