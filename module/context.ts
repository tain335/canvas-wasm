import { Dye, JsAnyArray, JsBuffer, JsF32Array, JsImageData, JsStrMap, JsString } from "./jstypes";
import { FinalizeHandler, Raw } from "./finalize";
import { getWasmBridge } from "./registry";
import { KImage } from "./image";
import { CanvasWasm } from './canvas';
import { FonSlant, FontSpec, FontWidth } from "./font_spec";
import { Path2D } from "./path2d";
import { ImageData } from "./image_data";
import { parseCornerRadii, parseVariant, weightMap } from "./utils";
import { CanvasGradient } from './canvas_gradient';
import { CanvasPattern } from "./cavans_pattern";

type FillRule = "nonzero" | "evenodd";

type Style = string | CanvasPattern | CanvasGradient;



type State = {
  fillStyle: Style | null;
  strokeStyle: Style | null;
}

export class Context2D extends Raw {

  stack: State[] = [{
    fillStyle: null,
    strokeStyle: null,
  }]

  constructor(private canvas: CanvasWasm) {
    let contextPtr = getWasmBridge()._new_context(canvas.raw());
    super(new FinalizeHandler(()=> {
      getWasmBridge()._free(this.ptr);
    }));
    this.ptr = contextPtr;
  }
  raw(): Context2DPtr {
    return this.ptr;
  }

  private currentState(): State {
    return this.stack[this.stack.length - 1];
  }

  get fillStyle(): Style | null {
    return this.currentState().fillStyle;
  }

  get strokeStyle(): Style | null {
    return this.currentState().fillStyle;
  }

  get lineWidth() {
    return this.bridge._get_lineWidth(this.raw());
  }

  set lineWidth(width: number) {
    this.bridge._set_lineWidth(this.raw(), width);
  }

  set fillStyle(style: Style) {
    this.currentState().fillStyle = style;
    if(typeof style === 'string') {
      const dye = Dye.fromColor(style);
      this.bridge._set_fillStyle(this.ptr, dye.raw());
    } else if(style instanceof CanvasPattern) {
      const dye = Dye.fromPattern(style.raw());
      this.bridge._set_fillStyle(this.ptr,  dye.raw());
    } else if(style instanceof CanvasGradient) {
      const dye = Dye.fromGrident(style.raw());
      this.bridge._set_fillStyle(this.ptr, dye.raw());
    } else {
      throw new Error('unsupport fillStyle type');
    }
  }

  set strokeStyle(style: Style) {
   this.currentState().fillStyle = style;
    if(typeof style === 'string') {
      const dye = Dye.fromColor(style);
      this.bridge._set_strokeStyle(this.ptr, dye.raw());
    } else if(style instanceof CanvasPattern) {
      const dye = Dye.fromPattern(style.raw());
      this.bridge._set_strokeStyle(this.ptr,  dye.raw());
    } else if(style instanceof CanvasGradient) {
      const dye = Dye.fromGrident(style.raw());
      this.bridge._set_strokeStyle(this.ptr, dye.raw());
    } else {
      throw new Error('unsupport fillStyle type');
    }
  }

  get direction(): string {
    return JsString.fromPtr(this.bridge._get_direction(this.raw())).value;
  }

  set direction(dir: string) {
    this.bridge._set_direction(this.raw(), (new JsString(dir)).raw());
  }

  set filter(filter: string) {}

  get filter() {
    return ''
  }

  set fontKerning(kerning: string) {}

  get fontKerning() {
    return "normal"
  }

  set fontStretch(s: string) {

  }

  get fontStretch() {
    return "nomal";
  }

  set fontVariantCaps(cap: string) {

  }

  get fontVariantCaps() {
    return "nomal"
  }

  set globalAlpha(alpha: number) {
    this.bridge._set_globalAlpha(this.raw(), alpha);
  }

  get globalAlpha(): number {
    return this.bridge._get_globalAlpha(this.raw());
  }

  set globalCompositeOperation(operation: string) {
    this.bridge._set_globalCompositeOperation(this.raw(), (new JsString(operation).raw()));
  }

  get globalCompositeOperation(): string {
    return JsString.fromPtr(this.bridge._get_globalCompositeOperation(this.raw())).value;
  }

  set imageSmoothingEnabled(enabled: boolean) {
    this.bridge._set_imageSmoothingEnabled(this.raw(), enabled ? 1 : 0);
  }

  get imageSmoothingEnabled(): boolean {
    return this.bridge._get_imageSmoothingEnabled(this.raw()) === 1;
  }

  set imageSmoothingQuality(quality: string) {
    this.bridge._set_imageSmoothingQuality(this.raw(), new JsString(quality).raw())
  }

  get imageSmoothingQuality(): string {
    return JsString.fromPtr(this.bridge._get_imageSmoothingQuality(this.raw())).value;
  }

  // TODO TextTraking
  set letterSpacing(spacing: string) {}

  get letterSpacing() {
    return "0px"
  }

  set lineCap(cap: string) {
    this.bridge._set_lineCap(this.raw(), new JsString(cap).raw());
  }

  get lineCap() {
    return JsString.fromPtr(this.bridge._get_lineCap(this.raw())).value;
  }

  set lineDashOffset(offset: number) {
    this.bridge._setLineDash(this.raw(), offset);
  }

  get lineDashOffset() {
    return this.bridge._getLineDash(this.raw())
  }

  set lineJoin(join: string) {
    this.bridge._set_lineJoin(this.raw(), new JsString(join).raw());
  }

  get lineJoin() {
    return JsString.fromPtr(this.bridge._get_lineJoin(this.raw())).value;
  }

  set miterLimit(limit: number) {
    this.bridge._set_miterLimit(this.raw(), limit);
  }

  get miterLimit() {
    return this.bridge._get_miterLimit(this.raw());
  }

  set shadowBlur(blur: number) {
    this.bridge._set_shadowBlur(this.raw(), blur);
  }

  get shadowBlur(): number {
    return this.bridge._get_shadowBlur(this.raw());
  }

  set shadowColor(color: string) {
    this.bridge._set_shadowColor(this.raw(), new JsString(color).raw());
  }

  get shadowColor(): string {
    return JsString.fromPtr(this.bridge._get_shadowColor(this.raw())).value;
  }

  set shadowOffsetX(offsetX: number) {
    this.bridge._set_shadowOffsetX(this.raw(), offsetX);
  }

  get shadowOffsetX() {
    return this.bridge._get_shadowOffsetX(this.raw())
  }

  set shadowOffsetY(offsetY: number) {
    this.bridge._set_shadowOffsetY(this.raw(), offsetY);
  }

  get shadowOffsetY() {
    return this.bridge._get_shadowOffsetY(this.raw())
  }

  set textAlign(align: string) {
    this.bridge._set_textAlign(this.raw(), new JsString(align).raw());
  }

  get textAlign() {
    return JsString.fromPtr(this.bridge._get_textAlign(this.raw())).value;
  }

  set textBaseline(baseline: string) {
    this.bridge._set_textBaseline(this.raw(), new JsString(baseline).raw());
  }

  get textBaseline() {
    return JsString.fromPtr(this.bridge._get_textBaseline(this.raw())).value
  }

  set textRendering(rendering: string) {}

  get textRendering() {
    return "auto"
  }

  set wordSpacing(spacing: string) {}

  get wordSpacing() {
    return "0px";
  }

  get font() {
    return JsString.fromPtr(this.bridge._get_font(this.raw())).value
  }

  set font(f: string) {
    const div = document.createElement('div');
    div.style.font = f;
    this.canvas.el.parentElement?.appendChild(div);
    const styles = getComputedStyle(div);
    const fontWeight = styles.fontWeight;
    const fontSize = styles.fontSize;
    const variant =  styles.fontVariant;
    const fontWidth = styles.fontStretch;
    styles.fontFeatureSettings
    const familes = styles.fontFamily.split(",").map((item)=> item.trim()).map((item)=> {
      if(item.startsWith("\"") && item.endsWith("\"")) {
        return item.substring(1, item.length - 1);
      }
      return item;
    });
    const fontStyle = styles.fontStyle;
    const spec = new FontSpec();
    spec.setCanonical(f);

    spec.setStyle(weightMap[fontWeight] ?? Number(fontWeight), fontWidth as FontWidth, fontStyle as FonSlant);
    spec.setFamiles(...familes);
    spec.setSize(parseFloat(fontSize));
    spec.setVariant(variant);
    // set feature
    const variantObj = parseVariant(variant)
    const featureMap = new Map<string, "on" | "off" | number>();
    variantObj.features.on.for((f: string)=> {
      featureMap.set(f, "on");
    });
    variantObj.features.off.for((f: string)=> {
      featureMap.set(f,  "off");
    });
    Object.keys(variantObj).forEach((key)=> {
      if(key !== "on" && key !== "off") {
        featureMap.set(key, variantObj[key] as number);
      }
    })
    spec.setFeatures(featureMap);

    this.canvas.el.parentElement?.removeChild(div);
    this.bridge._set_font(this.raw(), spec.raw());
  }

  rect(x: number, y: number, width: number, height: number) {
    const arr = new JsF32Array(4);
    arr.push(x, y, width, height);
    this.bridge._rect(this.ptr, arr.raw());
  }

  fillRect(x: number, y: number, width: number, height: number) {
    const arr = new JsF32Array(4);
    arr.push(x, y, width, height);
    this.bridge._fillRect(this.ptr, arr.raw());
  }

  drawImage(image: InstanceType<typeof Image> | Context2D, sx: number, sy: number, sw?: number, sh?: number, dx?: number, dy?: number, dw?: number, dh?: number) {
    const args = [sx, sy, sw, sh, dx, dy, dw, dh].filter((v)=> v !== undefined) as number[]
    const arr = new JsF32Array(args.length);
    args.forEach((arg)=> {
      arr.push(arg);
    })
    if(image instanceof Image) {
      const img = KImage.fromImage(image);
      this.bridge._drawImage(this.raw(), img.raw(), arr.raw());
    }
  }

  drawImageFromBuffer(imageBuffer: Uint8Array, sx: number, sy: number, sw?: number, sh?: number, dx?: number, dy?: number, dw?: number, dh?: number) {
    const args = [sx, sy, sw, sh, dx, dy, dw, dh].filter((v)=> v !== undefined) as number[];
    const arr = new JsF32Array(args.length);
    args.forEach((v)=> {
      arr.push(v);
    });
    const jsbuff = new JsBuffer(imageBuffer.length);
    for(let i = 0; i < imageBuffer.length; i++) {
      jsbuff.push(imageBuffer[i]);
    }
    this.bridge._drawImageFromBuffer(this.raw(), jsbuff.raw(), arr.raw());
  }

  fillText(text: string , x: number, y: number, maxWidth?: number) {
    const t = new JsString(text);
    const args = [x, y, maxWidth].filter((v)=> v !== undefined) as number[];
    const arr = new JsF32Array(args.length);
    args.forEach((v)=> {
      arr.push(v);
    });
    this.bridge._fillText(this.raw(), t.raw(), arr.raw())
  }

  drawRichText(text: string , x: number, y: number, maxWidth?: number) {
    const t = new JsString(text);
    const args = [x, y, maxWidth].filter((v)=> v !== undefined) as number[];
    const arr = new JsF32Array(args.length);
    args.forEach((v)=> {
      arr.push(v);
    });
    this.bridge._drawRichText(this.raw(), t.raw(), arr.raw())
  }

  strokeText(text: string, x: number, y: number, maxWidth?: number) {
    const t = new JsString(text);
    const args = [x, y, maxWidth].filter((v)=> v !== undefined) as number[];
    const arr = new JsF32Array(args.length);
    args.forEach((v)=> {
      arr.push(v);
    });
    this.bridge._strokeText(this.raw(), t.raw(), arr.raw())
  }

  beginPath() {
    this.bridge._beginPath(this.raw());
  }

  moveTo(x: number, y: number) {
    const arr = new JsF32Array(2);
    arr.push(x ?? 0);
    arr.push(y ?? 0);
    this.bridge._moveTo(this.raw(), arr.raw());
  }

  lineTo(x: number, y: number) {
    const arr = new JsF32Array(2);
    arr.push(x ?? 0);
    arr.push(y ?? 0);
    this.bridge._lineTo(this.raw(), arr.raw());
  }

  stroke(path?: Path2D) {
    if(path) {
      this.bridge._stroke(this.raw(), path.raw());
    } else {
      this.bridge._stroke(this.raw(), 0);
    }
  }

  clearRect(x: number, y: number, width: number, height: number) {
    const arr = new JsF32Array(4);
    arr.push(x, y, width, height);
    this.bridge._clearRect(this.raw(), arr.raw());
  }

  arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, anticlockwise?: boolean) {
    const arr = new JsF32Array(6);
    arr.push(x, y, radius, startAngle, endAngle, anticlockwise ? 1 : 0);
    this.bridge._arc(this.raw(), arr.raw());
  }

  arcTo(x1: number, y1: number, x2: number, y2: number, radius: number) {
    const arr = new JsF32Array(5);
    arr.push(x1, y1, x2, y2, radius);
    this.bridge._arcTo(this.raw(), arr.raw());
  }

  bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number) {
    const arr = new JsF32Array(6);
    arr.push(cp1x, cp1y, cp2x, cp2y, x, y);;
    this.bridge._bezierCurveTo(this.raw(), arr.raw());
  }

  clip(path?: Path2D | FillRule, fileRule?: FillRule) {
    if(!path) {
      this.bridge._clip(this.raw(), 0, 0);
    } else if(typeof path === 'string') {
      this.bridge._clip(this.raw(), 0, path === "evenodd" ? 1 : 0);
    } else if(path instanceof Path2D) {
      this.bridge._clip(this.raw(), path.raw(), fileRule === "evenodd" ? 1 : 0);
    }
  }

  closePath() {
    this.bridge._closePath(this.raw());
  }

  createConicGradient(startAngle: number, x: number, y: number) {
    return CanvasGradient.createConicGradient(startAngle, x, y);
  }

  
  createLinearGradient(x0: number, y0: number, x1: number, y1: number) {
    return CanvasGradient.createLinearGradient(x0, y0, x1, y1);
  }

  createRadialGradient(x0: number, y0: number, r0: number, x1: number, y1: number, r1: number) {
    return CanvasGradient.createRadialGradient(x0, y0, r0, x1, y1, r1);
  }

  createImageData(width: number | ImageData, height?: number) {
    if(width instanceof ImageData) {
      return new ImageData(width.data, width.width, width.height);
    } else {
      return new ImageData(new Uint8Array(width * (height as number) * 4), width, (height as number));
    }
  }
  

  createPattern(image: HTMLImageElement | SVGImageElement | HTMLVideoElement | HTMLCanvasElement | VideoFrame | ImageBitmap | OffscreenCanvas | CanvasWasm, repetition = "repeat") {
    return CanvasPattern.fromImage(KImage.fromImage(image))
  }


  drawFocusIfNeeded() {
    throw new Error("not support")
  }

  ellipse(x: number, y: number, radiusX: number, radiusY: number, rotation: number, startAngle: number, endAngle: number, anticlockwise?: boolean) {
    const arr = new JsF32Array(8);
    arr.push(x, y, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise ? 1.0 : 0);
    this.bridge._ellipse(this.raw(), arr.raw());
  }
  // fileRule https://www.zhangxinxu.com/wordpress/2018/10/nonzero-evenodd-fill-mode-rule/
  fill(path?: Path2D | FillRule, fileRule?: FillRule) {
    if(!path) {
      this.bridge._fill(this.raw(), 0, 0);
    } else if(typeof path === 'string') {
      this.bridge._fill(this.raw(), 0, path === "evenodd" ? 1 : 0);
    } else if(path instanceof Path2D) {
      this.bridge._fill(this.raw(), path.raw(), fileRule === "evenodd" ? 1 : 0);
    }
  }

  getContextAttributes() {
    return {
      alpha: true,
      colorSpace: 'srgb',
      desynchronized: false,
      willReadFrequently: false,
    }
  }

  getImageData(x: number, y: number, width: number, height: number): ImageData {
    const imageData = JsImageData.fromPtr(this.bridge._getImageData(this.raw(), x, y, width, height));
    return new ImageData(imageData.data, imageData.width, imageData.height);
  }

  putImageData(imageData: ImageData, dx: number, dy: number, dirtyX?: number, dirtyY?: number, dirtyWidth?: number, dirtyHeight?: number) {
    const args = [dx, dy, dirtyX, dirtyY, dirtyWidth, dirtyHeight].filter((v)=> v !== undefined) as number[];
    const arr = new JsF32Array(args.length);
    args.forEach((v)=> {
      arr.push(v);
    });
    const jsImageData = new JsImageData(imageData.data, imageData.width, imageData.height);
    getWasmBridge()._putImageData(this.raw(), jsImageData.raw(), arr.raw());
  }

  getLineDash() {
    const arr = this.bridge._getLineDash(this.raw());
    return JsF32Array.fromPtr(arr).toArray()
  }

  getTransform() {
    const arr = this.bridge._get_currentTransform(this.raw());
    return new DOMMatrix( JsF32Array.fromPtr(arr).toArray());
  }

  isPointInPath(path: Path2D | number, x: number, y?: number | FillRule, fileRule?: FillRule): boolean {
    if(arguments.length === 2) {
      return this.bridge._isPointInPath(this.raw(), 0, path as number, x, 0) === 1;
    } else if(arguments.length === 3) {
      if(path instanceof Path2D) {
        return this.bridge._isPointInPath(this.raw(), path.raw(), x, y as number, 0) === 1;
      } else {
        return this.bridge._isPointInPath(this.raw(), 0, x, y as number, fileRule === "evenodd" ? 1 : 0) === 1;
      }
    } else if (arguments.length === 4) {
      return this.bridge._isPointInPath(this.raw(), (path as Path2D).raw(), x, y as number, fileRule === "evenodd" ? 1 : 0) === 1;
    }
    throw new Error('unsupport arguments length');
  }

  isPointInStroke(path: Path2D | number, x: number, y?: number): boolean {
    if(path instanceof Path2D) {
      return this.bridge._isPointInStroke(this.raw(), path.raw(), x, y as number, 0) === 1;
    } else {
      return this.bridge._isPointInStroke(this.raw(), 0, x, y as number, 0) === 1;
    }
  }

  measureText(text: string) {
    const t = new JsString(text);
    const arr = new JsF32Array(0);
    const ptr = this.bridge._measureText(this.raw(), t.raw(), arr.raw());
    const result = JsAnyArray.fromPtr(ptr);
    if(result.len() === 0) {
      throw new Error('cannot measure text: ' + text);
    } else {
      const ptr = result.get(0) as JsF32ArrayPtr;
      const line = JsF32Array.fromPtr(ptr);
      return {
        width: line.get(0),
        actualBoundingBoxLeft: line.get(1),
        actualBoundingBoxRight: line.get(2),
        fontBoundingBoxAscent: line.get(3),
        fontBoundingBoxDescent: line.get(4),
        actualBoundingBoxAscent: line.get(5),
        actualBoundingBoxDescent: line.get(6),
        emHeightAscent: line.get(7),
        emHeightDescent: line.get(8),
        alphabeticBaseline: line.get(9),
        ideographicBaseline: line.get(10)
      }
    }
  }

  quadraticCurveTo(cpx: number, cpy: number, x: number, y: number) {
    const arr = new JsF32Array(4);
    arr.push(cpx, cpy, x, y);
    this.bridge._quadraticCurveTo(this.raw(), arr.raw());
  }

  reset() {
    this.bridge._reset(this.raw());
  }

  resetTransform() {
    this.bridge._resetTransform(this.raw());
  }

  rotate(angle: number) {
    this.bridge._rotate(this.raw(), angle);
  }

  roundRect(x: number, y: number, w: number, h: number, r: number | number[] | DOMPoint[] | DOMPoint) {
    let radii = parseCornerRadii(r);
    if (radii){
      if (w < 0) radii = [radii[1], radii[0], radii[3], radii[2]]
      if (h < 0) radii = [radii[3], radii[2], radii[1], radii[0]]
      const arr = new JsF32Array(12);
      arr.push(x, y, w, h, ...radii.map(({x, y}) => [x, y]).flat())
      this.bridge._roundRect(this.raw(), arr.raw());
    }
  }

  save() {
    this.bridge._save(this.raw());
    this.stack.push(Object.assign({}, this.currentState()));
  }

  retore() {
    this.bridge._restore(this.raw());
    if(this.stack.length !== 1) {
      this.stack.pop();
    }
  }

  scale(x: number, y: number) {
    const arr = new JsF32Array(2);
    arr.push(x, y);
    this.bridge._scale(this.raw(), arr.raw());
  }

  setLineDash(segments: number[]) {
    const arr = new JsF32Array(segments.length);
    arr.push(...segments);
    this.bridge._setLineDash(this.raw(), arr.raw());
  }

  setTransform(a: number | DOMMatrix, b?: number, c?: number, d?: number, e?: number, f?: number) {
    if(a instanceof DOMMatrix) {
      const f32Arr = a.toFloat32Array()
      const arr = new JsF32Array(f32Arr.length);
      for(let i = 0; i < f32Arr.length; i++) {
        arr.push(f32Arr[i]);
      }
      this.bridge._set_currentTransform(this.raw(), arr.raw());
    } else {
      const arr = new JsF32Array(6);
      arr.push(a, b as number, c as number, d as number, e as number, f as number);
      this.bridge._set_currentTransform(this.raw(), arr.raw());
    }
  }

  strokeRect(x: number, y: number, width: number, height: number) {
    const arr = new JsF32Array(4);
    arr.push(x, y, width, height);
    this.bridge._strokeRect(this.raw(), arr.raw());
  }

  transform(a: number, b: number, c: number, d: number, e: number, f: number) {
    const arr = new JsF32Array(6);
    arr.push(a, b, c, d, e, f);
    this.bridge._transform(this.raw(), arr.raw());
  }
}