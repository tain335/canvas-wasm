use skia_safe::{gpu::{gl::FramebufferInfo, BackendRenderTarget, DirectContext}, Point, Surface};

use crate::context::{api::reset, Context2D};

struct GpuState {
  context: DirectContext,
  framebuffer_info: FramebufferInfo,
}

/// This struct holds the state of the Rust application between JS calls.
///
/// It is created by [init] and passed to the other exported functions. Note that rust-skia data
/// structures are not thread safe, so a state must not be shared between different Web Workers.
pub struct SurfaceState {
  gpu_state: GpuState,
  pub surface: Surface,
}

impl SurfaceState {
  fn new(gpu_state: GpuState, surface: Surface) -> Self {
    SurfaceState { gpu_state, surface }
  }

  fn set_surface(&mut self, surface: Surface) {
      self.surface = surface;
  }
}


/// Create the GPU state from the JavaScript WebGL context.
///
/// This needs to be done once per WebGL context.
fn create_gpu_state() -> GpuState {
  let interface = skia_safe::gpu::gl::Interface::new_native().unwrap();
  let context = skia_safe::gpu::DirectContext::new_gl(interface, None).unwrap();
    let framebuffer_info = {
        let mut fboid: gl::types::GLint = 0;
        unsafe { gl::GetIntegerv(gl::FRAMEBUFFER_BINDING, &mut fboid) };

        FramebufferInfo {
          fboid: fboid.try_into().unwrap(),
          format: skia_safe::gpu::gl::Format::RGBA8.into(),
          // protected: skia_safe::gpu::Protected::No,
      }
    };

    GpuState {
        context,
        framebuffer_info,
    }
}


/// Create the Skia surface that will be used for rendering.
fn create_surface(gpu_state: &mut GpuState, width: i32, height: i32) -> Surface {
  let backend_render_target =
      BackendRenderTarget::new_gl((width, height), 1, 8, gpu_state.framebuffer_info);

  Surface::from_backend_render_target(
    &mut gpu_state.context,
    &backend_render_target,
    skia_safe::gpu::SurfaceOrigin::BottomLeft,
    skia_safe::ColorType::RGBA8888,
    None,
    None,
  )
  .unwrap()
}


/// Initialize the renderer.
///
/// This is called from JS after the WebGL context has been created.
#[no_mangle]
pub extern "C" fn init_surface(width: i32, height: i32) -> *mut SurfaceState {
    let mut gpu_state = create_gpu_state();
    let surface = create_surface(&mut gpu_state, width, height);
    let state = SurfaceState::new(gpu_state, surface);
    Box::into_raw(Box::new(state))
}

/// Resize the Skia surface
///
/// This is called from JS when the window is resized.
#[no_mangle]
pub extern "C" fn resize_surface(state: *mut SurfaceState, width: i32, height: i32) {
  let state = unsafe { state.as_mut() }.expect("got an invalid state pointer");
  let surface = create_surface(&mut state.gpu_state, width, height);
  state.set_surface(surface);
}


#[no_mangle]
pub extern "C" fn render_to_surface(state: *mut SurfaceState, cx: *mut Context2D) {
  unsafe {
    if let Some(picture) = (*cx).get_image() {
      (*state).surface.canvas().draw_image(picture, Point{x: 0.0, y: 0.0}, None);
      (*state).surface.flush();
      reset(cx);
    } else {
      panic!("no image")
    }
  }
}