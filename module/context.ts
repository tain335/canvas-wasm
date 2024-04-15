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
import { debug, warn } from "./logger";

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
    debug('getFillStyle');
    return this.currentState().fillStyle;
  }

  get strokeStyle(): Style | null {
    debug('getStrokeStyle');
    return this.currentState().fillStyle;
  }

  get lineWidth() {
    debug('getLineWidth');
    return this.bridge._get_lineWidth(this.raw());
  }

  set lineWidth(width: number) {
    debug('setLineWidth', width);
    this.bridge._set_lineWidth(this.raw(), width);
  }

  set fillStyle(style: Style) {
    debug('setFillStyle', style);
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
    debug('setStrokeStyle', style);
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
    debug('getDirection');
    return JsString.fromPtr(this.bridge._get_direction(this.raw())).value;
  }

  set direction(dir: string) {
    debug('setDirection', dir);
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

  set fontStretch(s: string) {}

  get fontStretch() {
    return "nomal";
  }

  set fontVariantCaps(cap: string) {}

  get fontVariantCaps() {
    return "nomal"
  }

  set globalAlpha(alpha: number) {
    debug("setGlobalAlpha", alpha);
    this.bridge._set_globalAlpha(this.raw(), alpha);
  }

  get globalAlpha(): number {
    debug("getGlobalAlpha");
    return this.bridge._get_globalAlpha(this.raw());
  }

  set globalCompositeOperation(operation: string) {
    debug("setGlobalCompositeOperation", operation);
    this.bridge._set_globalCompositeOperation(this.raw(), (new JsString(operation).raw()));
  }

  get globalCompositeOperation(): string {
    debug("getGlobalCompositeOperation");
    return JsString.fromPtr(this.bridge._get_globalCompositeOperation(this.raw())).value;
  }

  set imageSmoothingEnabled(enabled: boolean) {
    debug("setImageSmoothingEnabled", enabled);
    this.bridge._set_imageSmoothingEnabled(this.raw(), enabled ? 1 : 0);
  }

  get imageSmoothingEnabled(): boolean {
    debug("getImageSmoothingEnabled");
    return this.bridge._get_imageSmoothingEnabled(this.raw()) === 1;
  }

  set imageSmoothingQuality(quality: string) {
    debug("setImageSmoothingQuality", quality);
    this.bridge._set_imageSmoothingQuality(this.raw(), new JsString(quality).raw())
  }

  get imageSmoothingQuality(): string {
    debug("getImageSmoothingQuality");
    return JsString.fromPtr(this.bridge._get_imageSmoothingQuality(this.raw())).value;
  }

  // TODO TextTraking
  set letterSpacing(spacing: string) {}

  get letterSpacing() {
    return "0px"
  }

  set lineCap(cap: string) {
    debug("setLineCap", cap);
    this.bridge._set_lineCap(this.raw(), new JsString(cap).raw());
  }

  get lineCap() {
    debug("getLineCap");
    return JsString.fromPtr(this.bridge._get_lineCap(this.raw())).value;
  }

  set lineDashOffset(offset: number) {
    debug("setLineDashOffset", offset);
    this.bridge._setLineDash(this.raw(), offset);
  }

  get lineDashOffset() {
    debug("getLineDashOffset");
    return this.bridge._getLineDash(this.raw())
  }

  set lineJoin(join: string) {
    debug("setLineJoin", join);
    this.bridge._set_lineJoin(this.raw(), new JsString(join).raw());
  }

  get lineJoin() {
    debug("getLineJoin");
    return JsString.fromPtr(this.bridge._get_lineJoin(this.raw())).value;
  }

  set miterLimit(limit: number) {
    debug("setMiterLimit", limit);
    this.bridge._set_miterLimit(this.raw(), limit);
  }

  get miterLimit() {
    debug("getMiterLimit");
    return this.bridge._get_miterLimit(this.raw());
  }

  set shadowBlur(blur: number) {
    debug("setShadowBlur", blur);
    this.bridge._set_shadowBlur(this.raw(), blur);
  }

  get shadowBlur(): number {
    debug("getShadowBlur");
    return this.bridge._get_shadowBlur(this.raw());
  }

  set shadowColor(color: string) {
    debug("setShadowColor", color);
    this.bridge._set_shadowColor(this.raw(), new JsString(color).raw());
  }

  get shadowColor(): string {
    debug("getShadowColor");
    return JsString.fromPtr(this.bridge._get_shadowColor(this.raw())).value;
  }

  set shadowOffsetX(offsetX: number) {
    debug("setShadowOffsetX", offsetX);
    this.bridge._set_shadowOffsetX(this.raw(), offsetX);
  }

  get shadowOffsetX() {
    debug("getShadowOffsetX");
    return this.bridge._get_shadowOffsetX(this.raw())
  }

  set shadowOffsetY(offsetY: number) {
    debug("setShadowOffsetY", offsetY);
    this.bridge._set_shadowOffsetY(this.raw(), offsetY);
  }

  get shadowOffsetY() {
    debug("getShadowOffsetY");
    return this.bridge._get_shadowOffsetY(this.raw())
  }

  set textAlign(align: string) {
    debug("setTextAlign", align);
    this.bridge._set_textAlign(this.raw(), new JsString(align).raw());
  }

  get textAlign() {
    debug("getTextAlign");
    return JsString.fromPtr(this.bridge._get_textAlign(this.raw())).value;
  }

  set textBaseline(baseline: string) {
    debug("setTextBaseline", baseline);
    this.bridge._set_textBaseline(this.raw(), new JsString(baseline).raw());
  }

  get textBaseline() {
    debug("getTextBaseline");
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
    debug("getFont");
    return JsString.fromPtr(this.bridge._get_font(this.raw())).value
  }

  set font(f: string) {
    debug("setFont", f);
    const div = document.createElement('div');
    div.style.font = f;
    const container = this.canvas.el instanceof HTMLCanvasElement ? this.canvas.el.parentElement : document.body;
    container?.appendChild(div);
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
    if(variant) {
      // set feature
      const variantObj = parseVariant(variant)
      const featureMap = new Map<string, "on" | "off" | number>();
      variantObj.features.on?.forEach((f: string)=> {
        featureMap.set(f, "on");
      });
      variantObj.features.off?.forEach((f: string)=> {
        featureMap.set(f,  "off");
      });
      Object.keys(variantObj).forEach((key)=> {
        if(key !== "on" && key !== "off") {
          featureMap.set(key, variantObj[key] as number);
        }
      })
      spec.setFeatures(featureMap);
    }

    container?.removeChild(div);
    this.bridge._set_font(this.raw(), spec.raw());
  }

  rect(x: number, y: number, width: number, height: number) {
    debug('rect', x, y, width, height);
    const arr = new JsF32Array(4);
    arr.push(x, y, width, height);
    this.bridge._rect(this.ptr, arr.raw());
  }

  fillRect(x: number, y: number, width: number, height: number) {
    debug('fillRect', x, y, width, height);
    const arr = new JsF32Array(4);
    arr.push(x, y, width, height);
    this.bridge._fillRect(this.ptr, arr.raw());
  }

  drawImage(image: CanvasWasm | HTMLCanvasElement | OffscreenCanvas | HTMLImageElement | SVGImageElement | HTMLVideoElement | VideoFrame | ImageBitmap, sx: number, sy: number, sw?: number, sh?: number, dx?: number, dy?: number, dw?: number, dh?: number) {
    debug('drawImage', image);
    if(window.CANVAS_WASM_RENDERER_CONTEXT === 'html2canvas' && image instanceof HTMLImageElement) {
      // fix html2canvas一些绘制异常
      if(/\.svg$/.test(image.src)) {
        image.width = dw ?? image.naturalWidth;
        image.height = dh ?? image.naturalHeight;
        sw = dw ?? image.naturalWidth;
        sh = dh ?? image.naturalHeight;
      }
    }
    const args = [sx, sy, sw, sh, dx, dy, dw, dh].filter((v)=> v !== undefined) as number[]
    
    const arr = new JsF32Array(args.length);
    args.forEach((arg)=> {
      arr.push(arg);
    })
    
    const img = KImage.fromImage(image);
    this.bridge._drawImage(this.raw(), img.raw(), arr.raw());
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
    debug('fillText', text, x, y, maxWidth);
    const t = new JsString(text);
    const args = [x, y, maxWidth].filter((v)=> v !== undefined) as number[];
    const arr = new JsF32Array(args.length);
    args.forEach((v)=> {
      arr.push(v);
    });
    this.bridge._fillText(this.raw(), t.raw(), arr.raw())
  }

  drawRichText(text: string , x: number, y: number, maxWidth?: number) {
    debug('drawRichText', text, x, y, maxWidth);
    const t = new JsString(text);
    const args = [x, y, maxWidth].filter((v)=> v !== undefined) as number[];
    const arr = new JsF32Array(args.length);
    args.forEach((v)=> {
      arr.push(v);
    });
    this.bridge._drawRichText(this.raw(), t.raw(), arr.raw())
  }

  strokeText(text: string, x: number, y: number, maxWidth?: number) {
    debug('strokeText', text, x, y, maxWidth);
    const t = new JsString(text);
    const args = [x, y, maxWidth].filter((v)=> v !== undefined) as number[];
    const arr = new JsF32Array(args.length);
    args.forEach((v)=> {
      arr.push(v);
    });
    this.bridge._strokeText(this.raw(), t.raw(), arr.raw())
  }

  beginPath() {
    debug('beginPath');
    this.bridge._beginPath(this.raw());
  }

  moveTo(x: number, y: number) {
    debug('moveTo', x, y);
    const arr = new JsF32Array(2);
    arr.push(x ?? 0);
    arr.push(y ?? 0);
    this.bridge._moveTo(this.raw(), arr.raw());
  }

  lineTo(x: number, y: number) {
    debug('lineTo', x, y);
    const arr = new JsF32Array(2);
    arr.push(x ?? 0);
    arr.push(y ?? 0);
    this.bridge._lineTo(this.raw(), arr.raw());
  }

  stroke(path?: Path2D) {
    debug('stroke', path);
    if(path) {
      this.bridge._stroke(this.raw(), path.raw());
    } else {
      this.bridge._stroke(this.raw(), 0);
    }
  }

  clearRect(x: number, y: number, width: number, height: number) {
    debug('clearRect', x, y, width, height);
    const arr = new JsF32Array(4);
    arr.push(x, y, width, height);
    this.bridge._clearRect(this.raw(), arr.raw());
  }

  arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, anticlockwise?: boolean) {
    debug('arc', x, y, radius, startAngle, endAngle, anticlockwise);
    const arr = new JsF32Array(6);
    arr.push(x, y, radius, startAngle, endAngle, anticlockwise ? 1 : 0);
    this.bridge._arc(this.raw(), arr.raw());
  }

  arcTo(x1: number, y1: number, x2: number, y2: number, radius: number) {
    debug('arcTo', x1, y1, x2, y2, radius);
    const arr = new JsF32Array(5);
    arr.push(x1, y1, x2, y2, radius);
    this.bridge._arcTo(this.raw(), arr.raw());
  }

  bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number) {
    debug('bezierCurveTo', cp1x, cp1y, cp2x, cp2y, x, y);
    const arr = new JsF32Array(6);
    arr.push(cp1x, cp1y, cp2x, cp2y, x, y);;
    this.bridge._bezierCurveTo(this.raw(), arr.raw());
  }

  clip(path?: Path2D | FillRule, fileRule?: FillRule) {
    debug('clip', path, fileRule);
    if(!path) {
      this.bridge._clip(this.raw(), 0, 0);
    } else if(typeof path === 'string') {
      this.bridge._clip(this.raw(), 0, path === "evenodd" ? 1 : 0);
    } else if(path instanceof Path2D) {
      this.bridge._clip(this.raw(), path.raw(), fileRule === "evenodd" ? 1 : 0);
    }
  }

  closePath() {
    debug('closePath');
    this.bridge._closePath(this.raw());
  }

  createConicGradient(startAngle: number, x: number, y: number) {
    debug('createConicGradient', startAngle, x, y);
    return CanvasGradient.createConicGradient(startAngle, x, y);
  }

  
  createLinearGradient(x0: number, y0: number, x1: number, y1: number) {
    debug('createLinearGradient', x0, y0, x1, y1);
    return CanvasGradient.createLinearGradient(x0, y0, x1, y1);
  }

  createRadialGradient(x0: number, y0: number, r0: number, x1: number, y1: number, r1: number) {
    debug('createRadialGradient', x0, y0, x1, y1, r1);
    return CanvasGradient.createRadialGradient(x0, y0, r0, x1, y1, r1);
  }

  createImageData(width: number | ImageData, height?: number) {
    debug('createImageData', width, height);
    if(width instanceof ImageData) {
      return new ImageData(width.data, width.width, width.height);
    } else {
      return new ImageData(new Uint8Array(width * (height as number) * 4), width, (height as number));
    }
  }
  

  createPattern(image: HTMLImageElement | SVGImageElement | HTMLVideoElement | HTMLCanvasElement | VideoFrame | ImageBitmap | OffscreenCanvas | CanvasWasm, repetition = "repeat") {
    debug('createPattern', repetition);
    return CanvasPattern.fromImage(KImage.fromImage(image))
  }


  drawFocusIfNeeded() {
    warn('drawFocusIfNeeded not support');
  }

  ellipse(x: number, y: number, radiusX: number, radiusY: number, rotation: number, startAngle: number, endAngle: number, anticlockwise?: boolean) {
    debug('ellipse', x, y, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise);
    const arr = new JsF32Array(8);
    arr.push(x, y, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise ? 1.0 : 0);
    this.bridge._ellipse(this.raw(), arr.raw());
  }
  // fileRule https://www.zhangxinxu.com/wordpress/2018/10/nonzero-evenodd-fill-mode-rule/
  fill(path?: Path2D | FillRule, fillRule?: FillRule) {
    debug('fill', path, fillRule);
    if(!path) {
      this.bridge._fill(this.raw(), 0, 0);
    } else if(typeof path === 'string') {
      this.bridge._fill(this.raw(), 0, path === "evenodd" ? 1 : 0);
    } else if(path instanceof Path2D) {
      this.bridge._fill(this.raw(), path.raw(), fillRule === "evenodd" ? 1 : 0);
    }
  }

  getContextAttributes() {
    debug('getContextAttributes');
    return {
      alpha: true,
      colorSpace: 'srgb',
      desynchronized: false,
      willReadFrequently: false,
    }
  }

  getImageData(x: number, y: number, width: number, height: number): ImageData {
    debug('getImageData', x, y, width, height);
    const imageData = JsImageData.fromPtr(this.bridge._getImageData(this.raw(), x, y, width, height));
    return new ImageData(imageData.data, imageData.width, imageData.height);
  }

  putImageData(imageData: ImageData, dx: number, dy: number, dirtyX?: number, dirtyY?: number, dirtyWidth?: number, dirtyHeight?: number) {
    debug('putImageData', imageData, dx, dy, dirtyX, dirtyY, dirtyWidth, dirtyHeight);
    const args = [dx, dy, dirtyX, dirtyY, dirtyWidth, dirtyHeight].filter((v)=> v !== undefined) as number[];
    const arr = new JsF32Array(args.length);
    args.forEach((v)=> {
      arr.push(v);
    });
    const jsImageData = new JsImageData(imageData.data, imageData.width, imageData.height);
    getWasmBridge()._putImageData(this.raw(), jsImageData.raw(), arr.raw());
  }

  getLineDash() {
    debug('getLineDash');
    const arr = this.bridge._getLineDash(this.raw());
    return JsF32Array.fromPtr(arr).toArray()
  }

  getTransform() {
    debug('getTransform');
    const arr = this.bridge._get_currentTransform(this.raw());
    return new DOMMatrix( JsF32Array.fromPtr(arr).toArray());
  }

  isPointInPath(path: Path2D | number, x: number, y?: number | FillRule, fileRule?: FillRule): boolean {
    debug('isPointInPath', path, x, y, fileRule);
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
    debug('isPointInStroke', path, x, y);
    if(path instanceof Path2D) {
      return this.bridge._isPointInStroke(this.raw(), path.raw(), x, y as number, 0) === 1;
    } else {
      return this.bridge._isPointInStroke(this.raw(), 0, x, y as number, 0) === 1;
    }
  }

  measureText(text: string) {
    debug('measureText', text);
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
    debug('quadraticCurveTo', cpx, cpy, x, y);
    const arr = new JsF32Array(4);
    arr.push(cpx, cpy, x, y);
    this.bridge._quadraticCurveTo(this.raw(), arr.raw());
  }

  reset() {
    debug('reset');
    this.bridge._reset(this.raw());
  }

  resetTransform() {
    debug('resetTransform');
    this.bridge._resetTransform(this.raw());
  }

  rotate(angle: number) {
    debug('rotate', angle);
    this.bridge._rotate(this.raw(), angle);
  }

  translate(x: number, y: number) {
    debug('translate', x, y);
    const arr = new JsF32Array(2);
    arr.push(x, y);
    this.bridge._translate(this.raw(), arr.raw());
  }

  roundRect(x: number, y: number, w: number, h: number, r: number | number[] | DOMPoint[] | DOMPoint) {
    debug('roundRect', x, y, w, h, r);
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
    debug('save');
    this.bridge._save(this.raw());
    this.stack.push(Object.assign({}, this.currentState()));
  }

  restore() {
    debug('restore');
    this.bridge._restore(this.raw());
    if(this.stack.length !== 1) {
      this.stack.pop();
    }
  }

  scale(x: number, y: number) {
    debug('scale', x, y);
    const arr = new JsF32Array(2);
    arr.push(x, y);
    this.bridge._scale(this.raw(), arr.raw());
  }

  setLineDash(segments: number[]) {
    debug('setLineDash', segments);
    const arr = new JsF32Array(segments.length);
    arr.push(...segments);
    this.bridge._setLineDash(this.raw(), arr.raw());
  }

  setTransform(a: number | DOMMatrix, b?: number, c?: number, d?: number, e?: number, f?: number) {
    debug('setTransform', a, b, c, d, e, f);
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
    debug('strokeRect', x, y, width, height);
    const arr = new JsF32Array(4);
    arr.push(x, y, width, height);
    this.bridge._strokeRect(this.raw(), arr.raw());
  }

  transform(a: number, b: number, c: number, d: number, e: number, f: number) {
    debug('transform', a, b, c, d, e, f);
    const arr = new JsF32Array(6);
    arr.push(a, b, c, d, e, f);
    this.bridge._transform(this.raw(), arr.raw());
  }

  setSize(w: number, h: number) {
    debug('setSize', w, h);
    const arr = new JsF32Array(2);
    arr.push(w, h);
    this.bridge._set_size(this.raw(), arr.raw());
  }

  getSize() {
    debug('getSize');
    const size = JsF32Array.fromPtr(this.bridge._getSize(this.raw())).toArray()
    return {
      width: size[0],
      height: size[1]
    }
  }
}