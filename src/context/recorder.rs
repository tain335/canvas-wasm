use skia_safe::{Canvas as SkCanvas, ClipOp, Color, ColorSpace, Image as SkImage, Matrix, Path, Picture, PictureRecorder, Rect};

pub struct Recorder {
  bounds: Rect,
  pub current: PictureRecorder,
  matrix: Matrix,
  clip: Option<Path>,
}

impl Recorder {
  pub fn new(bounds:Rect) -> Self {
    let mut rec = PictureRecorder::new();
    rec.begin_recording(bounds, None);
    rec.recording_canvas().unwrap().save(); // start at depth 
    Recorder { current: rec, bounds, matrix:Matrix::default(), clip:None }
  }

  pub fn append<F>(&mut self, f:F)
  where F:FnOnce(&mut SkCanvas)
  {
    if let Some(canvas) = self.current.recording_canvas() {
      f(canvas);
    } else {
      panic!("no canvas");
    }
  }

  pub fn set_bounds(&mut self, bounds:Rect) {
    *self = Recorder::new(bounds);
  }

  pub fn update_bounds(&mut self, bounds:Rect){
    self.bounds = bounds; // non-destructively update the size
  }

  pub fn set_matrix(&mut self, matrix:Matrix){
    self.matrix = matrix;
    if let Some(canvas) = self.current.recording_canvas() {
      canvas.set_matrix(&matrix.into());
    }
  }

  pub fn restore(&mut self){
    if let Some(canvas) = self.current.recording_canvas() {
      canvas.restore_to_count(1);
      canvas.save();
      if let Some(clip) = &self.clip{
        canvas.clip_path(&clip, ClipOp::Intersect, true /* antialias */);
      }
      canvas.set_matrix(&self.matrix.into());
    }
  }

  pub fn set_clip(&mut self, clip:&Option<Path>){
    self.clip = clip.clone();
    self.restore();
  }

  pub fn get_image(&mut self) -> Option<SkImage>{
    if let Some(pict) = self.get_picture() {
      let size = self.bounds.size().to_floor();
      SkImage::from_picture(pict, size, None, None, skia_safe::image::BitDepth::U8, Some(ColorSpace::new_srgb()))
    } else {
      panic!("no picture")
    }
  }

  pub fn get_picture(&mut self) -> Option<Picture> {
    let pic = self.current.finish_recording_as_picture(Some(&self.bounds));
    pic
  }

}