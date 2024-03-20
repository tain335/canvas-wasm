type Ptr = number;
type CanvasPtr = Ptr;
type Context2DPtr = Ptr;
type SurfacePtr = Ptr;
type JsF32ArrayPtr = Ptr;
type DyePtr = Ptr;
type StringPtr = Ptr;
type Path2DPtr = Ptr;
type MatrixPtr = Ptr;
type ImagePtr = Ptr;
type JsBufferPtr = Ptr;
type JsAnyArrayPtr = Ptr;
type JsStrMapPtr = Ptr;
type FontSpecPtr = Ptr;
type ImageDataPtr = Ptr;
type CanvasGradientPtr = Ptr;
type CanvasPatternPtr = Ptr;
type CanvasTexturePtr = Ptr;

interface WasmBridge extends EmscriptenModule {
  _new_canvas(surface: SurfacePtr, width: number, height: number): CanvasPtr;
  _new_context(canvas: CanvasPtr): Context2DPtr;
  _init_surface(width: number, height: number): SurfacePtr;
  _resize_surface(surfacePtr: SurfacePtr, width: number, height: number);
  _render_to_surface(surfacePtr: SurfacePtr, context: Context2DPtr);

  _rect(contextPtr: Context2DPtr, array: JsF32ArrayPtr);
  _fillRect(contextPtr: Context2DPtr, array: JsF32ArrayPtr);
  _roundRect(contextPtr: Context2DPtr, array: JsF32ArrayPtr);
  _strokeRect(contextPtr: Context2DPtr, array: JsF32ArrayPtr);
  _clearRect(contextPtr: Context2DPtr, array: JsF32ArrayPtr);
  _arc(contextPtr: Context2DPtr, array: JsF32ArrayPtr);
  _ellipse(contextPtr: Context2DPtr, array: JsF32ArrayPtr);
  _moveTo(contextPtr: Context2DPtr, array: JsF32ArrayPtr);
  _lineTo(contextPtr: Context2DPtr, array: JsF32ArrayPtr);
  _arcTo(contextPtr: Context2DPtr, array: JsF32ArrayPtr);
  _bezierCurveTo(contextPtr: Context2DPtr, array: JsF32ArrayPtr);
  _quadraticCurveTo(contextPtr: Context2DPtr, array: JsF32ArrayPtr);
  _conicCurveTo(contextPtr: Context2DPtr, array: JsF32ArrayPtr);
  _beginPath(contextPtr: Context2DPtr);
  _closePath(contextPtr: Context2DPtr);
  _resetSize(contextPtr: Context2DPtr, canvasPtr: CanvasPtr);
  _getSize(contextPtr: Context2DPtr): JsF32ArrayPtr;
  _set_size(contextPtr: Context2DPtr, array: JsF32ArrayPtr);
  _reset(contextPtr: Context2DPtr);
  _save(contextPtr: Context2DPtr);
  _restore(contextPtr: Context2DPtr);
  _transform(contextPtr: Context2DPtr,  arr: JsF32ArrayPtr);
  _translate(contextPtr: Context2DPtr, arr: JsF32ArrayPtr);
  _scale(contextPtr: Context2DPtr, arr: JsF32ArrayPtr);
  _rotate(contextPtr: Context2DPtr, radians: number);
  _resetTransform(contextPtr: Context2DPtr);
  _createProjection(contextPtr: Context2DPtr, dstArr: JsF32ArrayPtr, src: JsF32ArrayPtr);
  _get_currentTransform(contextPtr: Context2DPtr): JsF32ArrayPtr;
  _set_currentTransform(contextPtr: Context2DPtr, arr: JsF32ArrayPtr);
  _get_fillStyle(contextPtr: Context2DPtr): DyePtr;
  _set_fillStyle(contextPtr: Context2DPtr, dyePtr: DyePtr);
  _get_strokeStyle(contextPtr: Context2DPtr): DyePtr;
  _set_strokeStyle(contextPtr: Context2DPtr, dye: DyePtr);
  _set_lineDashFit(contextPtr: Context2DPtr, style: StringPtr);
  _get_lineDashFit(contextPtr: Context2DPtr): StringPtr;
  _getLineDash(contextPtr: Context2DPtr): JsF32ArrayPtr;
  _setLineDash(contextPtr: Context2DPtr, arr: JsF32ArrayPtr);
  _get_lineCap(contextPtr: Context2DPtr): StringPtr;
  _set_lineCap(contextPtr: Context2DPtr, str: StringPtr);
  _get_lineDashOffset(contextPtr: Context2DPtr): number;
  _set_lineDashOffset(contextPtr: Context2DPtr, num: number);
  _get_lineJoin(contextPtr: Context2DPtr): StringPtr;
  _set_lineJoin(contextPtr: Context2DPtr, str: StringPtr);
  _get_lineWidth(contextPtr: Context2DPtr): number;
  _set_lineWidth(contextPtr: Context2DPtr, num: number);
  _get_miterLimit(contextPtr: Context2DPtr): number;
  _set_miterLimit(contextPtr: Context2DPtr, num: number);
  _drawCanvas(contextPtr: Context2DPtr, targetContextPtr: Context2DPtr, arr: JsF32ArrayPtr);
  _get_imageSmoothingEnabled(contextPtr: Context2DPtr): number;
  _set_imageSmoothingEnabled(contextPtr: Context2DPtr, smoothing: number);
  _get_imageSmoothingQuality(contextPtr: Context2DPtr): StringPtr;
  _set_imageSmoothingQuality(contextPtr: Context2DPtr, strPtr: StringPtr);
  _fillText(contextPtr: Context2DPtr, text: StringPtr, arr: JsF32ArrayPtr);
  _strokeText(contextPtr: Context2DPtr, text: StringPtr, arr: JsF32ArrayPtr);
  _get_font(contextPtr: Context2DPtr): StringPtr;
  _get_textAlign(contextPtr: Context2DPtr): StringPtr;
  _set_textAlign(contextPtr: Context2DPtr, text_align: StringPtr);
  _get_textBaseline(contextPtr: Context2DPtr): StringPtr;
  _set_textBaseline(contextPtr: Context2DPtr, text_baseline: StringPtr);
  _get_direction(contextPtr: Context2DPtr): StringPtr;
  _set_direction(contextPtr: Context2DPtr, direction: StringPtr);
  _get_globalAlpha(contextPtr: Context2DPtr): number;
  _set_globalAlpha(contextPtr: Context2DPtr, alpha: number);
  _get_globalCompositeOperation(contextPtr: Context2DPtr): StringPtr;
  _set_globalCompositeOperation(contextPtr: Context2DPtr, composition: StringPtr);
  _get_filter(contextPtr: Context2DPtr): StringPtr;
  _set_filter(contextPtr: Context2DPtr, filter: StringPtr);
  _get_shadowBlur(contextPtr: Context2DPtr): number;
  _set_shadowBlur(contextPtr: Context2DPtr, blur: number);
  _get_shadowColor(contextPtr: Context2DPtr): StringPtr;
  _set_shadowColor(contextPtr: Context2DPtr, color: StringPtr);
  _get_shadowOffsetX(contextPtr: Context2DPtr): number;
  _get_shadowOffsetY(contextPtr: Context2DPtr): number;
  _set_shadowOffsetX(contextPtr: Context2DPtr, offset_x: number);
  _set_shadowOffsetY(contextPtr: Context2DPtr, offset_y: number);
  _set_font(contextPtr: Context2DPtr, spec: FontSpecPtr);
  _fillText(contextPtr: Context2DPtr, text: StringPtr, arr: JsF32ArrayPtr);
  _drawRichText(contextPtr: Context2DPtr, text: StringPtr, arr: JsF32ArrayPtr);

  _outlineText(contextPtr: Context2DPtr, text: StringPtr);
  _measureText(contextPtr: Context2DPtr, text: StringPtr, arr: JsF32ArrayPtr);
  _getImageData(contextPtr: Context2DPtr, x: number, y: number, width: number, height: number): JsBufferPtr;
  _putImageData(contextPtr: Context2DPtr, image_data_ptr: ImageDataPtr, arr: JsF32ArrayPtr);
  _set_lineDashMarker(contextPtr: Context2DPtr, path: Path2DPtr);
  _get_lineDashMarker(contextPtr: Context2DPtr): Path2DPtr;
  _isPointInPath(contextPtr: Context2DPtr, path: Path2DPtr, x: number, y: number, rule: number);
  _isPointInStroke(contextPtr: Context2DPtr, path: Path2DPtr, x: number, y: number, rule: number);
  _clip(contextPtr: Context2DPtr, path: Path2DPtr, rule: u32);
  _fill(contextPtr: Context2DPtr, path: Path2DPtr, rule: u32);
  _stroke(contextPtr: Context2DPtr, path: Path2DPtr);  

  _drawImage(cx: Context2DPtr, image: ImagePtr, arr: JsF32ArrayPtr);
  _drawImageFromContext(cx: Context2DPtr, context: Context2DPtr, arr: JsF32ArrayPtr);
  _drawImageFromBuffer(cx: Context2DPtr, buf: JsBufferPtr, arr: JsF32ArrayPtr);

  _new_js_f32_array(cap: number): JsF32ArrayPtr;
  _js_f32_array_len(ptr: JsF32ArrayPtr): number;
  _js_f32_array_get(ptr: JsF32ArrayPtr, index: number): number;
  _js_f32_array_set(ptr: JsF32ArrayPtr, index: number, value: number);
  _js_f32_array_push(ptr: JsF32ArrayPtr, value: number);

  _new_js_buffer(cap: number): JsF32ArrayPtr;
  _js_buffer_len(ptr: JsF32ArrayPtr): number;
  _js_buffer_get(ptr: JsF32ArrayPtr, index: number): number;
  _js_buffer_set(ptr: JsF32ArrayPtr, index: number, value: number);
  _js_buffer_push(ptr: JsF32ArrayPtr, value: number);
  _new_dye_from_color(ptr: StringPtr): DyePtr;
  _new_dye_from_gradient(g: CanvasGradientPtr): DyePtr;
  _new_dye_from_pattern(p: CanvasPatternPtr): DyePtr;
  _new_dye_from_texture(t: CanvasTexturePtr): DyePtr;

  _new_js_any_array(cap: number): JsAnyArrayPtr;
  _js_any_array_len(arr: JsAnyArrayPtr): number;
  _js_any_array_get(arr: JsAnyArrayPtr, index: number): Ptr;
  _js_any_array_set(arr: JsAnyArrayPtr, index: number, v: Ptr);
  _js_any_array_push(arr: JsAnyArrayPtr, v: Ptr);

  _new_js_str_map(): JsStrMapPtr;
  _js_str_map_insert(m: JsStrMapPtr, k: StringPtr, v: StringPtr);
  _js_str_map_delete(m: JsStrMapPtr, k: StringPtr): number;
  _js_str_map_has(m: JsStrMapPtr, k: StringPtr): number;
  _js_str_map_clear(m: JsStrMapPtr);

  _new_font_spec(): FontSpecPtr;
  _font_spec_set_families(spec: FontSpecPtr, arr: JsAnyArrayPtr);
  _font_spec_set_size(spec: FontSpecPtr, size: number);
  _font_spec_set_leading(spec: FontSpecPtr, leading: number);
  _font_spec_set_style(spec: FontSpecPtr, weight: number, width: StringPtr, slant: StringPtr);
  _font_spec_set_canonical(spec: FontSpecPtr, canonical: StringPtr);
  _font_spec_set_features(spec: FontSpecPtr, features: JsStrMapPtr);
  _font_spec_set_variant(spec: FontSpecPtr, variant: StringPtr);

  _new_image_data(data: JsBufferPtr, width: number, height: number): ImageDataPtr;
  _image_data_get_data(image_data: ImageDataPtr);
  _image_data_get_width(image_data: ImageDataPtr): number;
  _image_data_get_height(image_data: ImageDataPtr): number;

  stringToNewUTF8(str: string): StringPtr;
  UTF8ToString(str: StringPtr): string;

  _new_path2d(): Path2DPtr;
  _new_path2d_form_svg(svg_path: StringPtr): Path2DPtr;
  _new_path2d_from_path(path: Path2DPtr): Path2DPtr;
  _path2d_add_path(path: Path2DPtr, otherPath: Path2DPtr, transform: MatrixPtr);
  _path2d_close_path(path: Path2DPtr);
  _path2d_move_to(path: Path2DPtr, x: number, y: number);
  _path2d_line_to(path: Path2DPtr, x: number, y: number);
  _path2d_bezier_curve_to(path: Path2DPtr, arr: JsF32ArrayPtr);
  _path2d_quadratic_curve_to(path: Path2DPtr, arr: JsF32ArrayPtr);
  _path2d_conic_curve_to(path: Path2DPtr, arr: JsF32ArrayPtr);
  _path2d_arc(path: Path2DPtr, arr: JsF32ArrayPtr);
  _path2d_arc_to(path: Path2DPtr, arr: JsF32ArrayPtr);
  _path2d_ellipse(path: Path2DPtr, arr: JsF32ArrayPtr);
  _path2d_rect(path: Path2DPtr, arr: JsF32ArrayPtr);
  _path2d_round_rect(path: Path2DPtr, arr: JsF32ArrayPtr);
  _path2d_op(path: Path2DPtr, otherPath: Path2DPtr, op: StringPtr): Path2DPtr;
  _path2d_interpolate(path: Path2DPtr, otherPath: Path2DPtr, weight: number): Path2DPtr;
  _path2d_simplify(path: Path2DPtr, rule: StringPtr): Path2DPtr;
  _path2d_unwind(path: Path2DPtr): Path2DPtr;
  _path2d_offset(path: Path2DPtr, dx: number, dy: number): Path2DPtr;
  _path2d_transform(path: Path2DPtr, matrix: MatrixPtr): Path2DPtr;
  _path2d_round(path: Path2DPtr, radius: number);
  _path2d_trim(path: Path2DPtr, begin: number, end: number, invert: number);
  _path2d_jitter(path: Path2DPtr, seg_len: number, std_dev: number, seed: number): Path2DPtr;
  _path2d_bounds(path: Path2DPtr): JSF32ArrayPtr;
  _path2d_contains(path: Path2DPtr, x: number, y: number): number;
  _path2d_get_d(path: Path2DPtr): StringPtr;
  _path2d_set_d(path: Path2DPtr, svg_path: StringPtr);

  _add_font_family(fontBuf: JsBufferPtr, alias: StringPtr);
  _reset_fonts();

  _new_image(): ImagePtr;
  _image_set_data(image: ImagePtr, buffer: JsBufferPtr): number;
  _image_get_width(image: ImagePtr): number;
  _image_get_height(image: ImagePtr): number;

  _new_linear_gradient(arr: JsBufferPtr): CanvasGradientPtr;
  _new_radial_gradient(arr: JsBufferPtr): CanvasGradientPtr;
  _new_conic_gradient(arr: JsBufferPtr): CanvasGradientPtr;
  _add_color_stop(g: CanvasGradientPtr, offset: number, color: StringPtr);
  
  _new_canvas_pattern_from_image(image: ImagePtr, repetition: StringPtr): CanvasPatternPtr;
  _new_canvas_pattern_from_canvas(cx: Context2DPtr, repetition: StringPtr): CanvasPatternPtr;
  _canvas_pattern_set_transform(cp: CanvasPatternPtr, arr: JsF32ArrayPtr);

  _new_canvas_texture(path: Path2DPtr, color: StringPtr, line: number, nums: JsF32ArrayPtr): CanvasTexturePtr;

  _get_image(cx: Context2DPtr): ImagePtr;

  _canvas_set_width(canvasPtr: CanvasPtr, width: number);
  _canvas_set_height(canvasPtr: CanvasPtr, height: number);
  _canvas_get_width(canvasPtr): number;
  _canvas_get_height(canvasPtr): number;
  _canvas_save_as(canvasPtr, format: StringPtr, quality: number, density: number, matte: StringPtr): JsBufferPtr;

  ready: Promise<void>
}

declare let createCanvasWasmModule: ()=> Promise<WasmBridge>