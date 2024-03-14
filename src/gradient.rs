#![allow(dead_code)]
#![allow(non_snake_case)]
use std::ffi::c_char;
use std::sync::{Arc, Mutex};
use skia_safe::{Shader, Color, Point, TileMode, Matrix};
use skia_safe::{gradient_shader, gradient_shader::GradientShaderColors::Colors};

use crate::context::jstypes::JsF32Array;
use crate::utils::{char_to_string, css_to_color, to_degrees};

enum Gradient{
  Linear{
    start:Point,
    end:Point,
    stops:Vec<f32>,
    colors:Vec<Color>,
  },
  Radial{
    start_point:Point,
    start_radius:f32,
    end_point:Point,
    end_radius:f32,
    stops:Vec<f32>,
    colors:Vec<Color>,
  },
  Conic{
    center:Point,
    angle:f32,
    stops:Vec<f32>,
    colors:Vec<Color>,
  }
}

#[derive(Clone)]
pub struct CanvasGradient{
  gradient:Arc<Mutex<Gradient>>
}

impl CanvasGradient{
  pub fn shader(&self) -> Option<Shader>{

    let gradient = Arc::clone(&self.gradient);
    let gradient = gradient.lock().unwrap();

    match &*gradient{
      Gradient::Linear{start, end, stops, colors} => {
        gradient_shader::linear((*start, *end), Colors(colors), Some(stops.as_slice()), TileMode::Clamp, None, None)
      },
      Gradient::Radial{start_point, start_radius, end_point, end_radius, stops, colors} => {
        gradient_shader::two_point_conical(
          *start_point, *start_radius,
          *end_point, *end_radius,
          Colors(colors), Some(stops.as_slice()),
          TileMode::Clamp, None, None)
      },
      Gradient::Conic{center, angle, stops, colors} => {
        let Point{x, y} = *center;
        let mut rotated = Matrix::new_identity();
        rotated
          .pre_translate((x, y))
          .pre_rotate(*angle, None)
          .pre_translate((-x, -y));

        gradient_shader::sweep(
          *center,
          Colors(colors),
          Some(stops.as_slice()),
          TileMode::Clamp,
          None, // angles
          None, // flags
          Some(&rotated), // local_matrix

        )
      }
    }
  }

  pub fn add_color_stop(&mut self, offset: f32, color:Color){
    // let gradient = &mut *self.gradient.borrow_mut();
    let gradient = Arc::clone(&self.gradient);
    let mut gradient = gradient.lock().unwrap();

    let stops = match &*gradient{
      Gradient::Linear{stops, ..} => stops,
      Gradient::Radial{stops, ..} => stops,
      Gradient::Conic{stops, ..} => stops,
    };

    // insert the new entries at the right index to keep the vectors sorted
    let idx = stops.binary_search_by(|n| (n-f32::EPSILON).partial_cmp(&offset).unwrap()).unwrap_or_else(|x| x);
    match &mut *gradient{
      Gradient::Linear{colors, stops, ..} => { colors.insert(idx, color); stops.insert(idx, offset); },
      Gradient::Radial{colors, stops, ..} => { colors.insert(idx, color); stops.insert(idx, offset); },
      Gradient::Conic{colors, stops, ..} => { colors.insert(idx, color); stops.insert(idx, offset); },
    };
  }
}

#[no_mangle]
pub unsafe fn new_linear_gradient(arr: *mut JsF32Array) -> *mut CanvasGradient {
  if let [x1, y1, x2, y2] = (*arr).as_slice()[0..4]{
    let start = Point::new(x1, y1);
    let end = Point::new(x2, y2);
    let ramp = Gradient::Linear{ start, end, stops:vec![], colors:vec![] };
    let canvas_gradient = Box::new(CanvasGradient{ gradient:Arc::new(Mutex::new(ramp)) });
    Box::into_raw(canvas_gradient)
  } else {
    panic!("Expected 4 arguments (x1, y1, x2, y2)");
  }
}

#[no_mangle]
pub unsafe fn new_radial_gradient(arr: *mut JsF32Array) -> *mut CanvasGradient {
  if let [x1, y1, r1, x2, y2, r2] = (*arr).as_slice()[0..6] {
    let start_point = Point::new(x1, y1);
    let end_point = Point::new(x2, y2);
    let bloom = Gradient::Radial{ start_point, start_radius: r1, end_point, end_radius: r2, stops:vec![], colors:vec![] };
    let canvas_gradient = Box::new(CanvasGradient{ gradient:Arc::new(Mutex::new(bloom)) });
    Box::into_raw(canvas_gradient)
  }else{
    panic!("Expected 6 arguments (x1, y1, r1, x2, y2, r2)");
  }
}

#[no_mangle]
pub unsafe fn new_conic_gradient(arr: *mut JsF32Array) -> *mut CanvasGradient {
  if let [theta, x, y] = (*arr).as_slice()[0..3] {
    let center = Point::new(x, y);
    let angle = to_degrees(theta) - 90.0;
    let sweep = Gradient::Conic{ center, angle, stops:vec![], colors:vec![] };
    let canvas_gradient = Box::new(CanvasGradient{ gradient:Arc::new(Mutex::new(sweep)) });
    Box::into_raw(canvas_gradient)
  } else {
    panic!("Expected 3 arguments (startAngle, x, y)");
  }
}

#[no_mangle]
pub unsafe fn add_color_stop(g: *mut CanvasGradient, offset: f32, color: *mut c_char) {
  let color = css_to_color(&char_to_string(color));
  if let Some(color) = color {
    (*g).add_color_stop(offset, color);
  }
}