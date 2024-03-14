import { FinalizeHandler, Raw } from "./finalize";
import { JsF32Array, JsString } from "./jstypes";
import { Matrix } from "./matrix";
import { getWasmBridge } from "./registry";

export class Path2D extends Raw {
  constructor(path?: Path2D | string) {
    let ptr: Path2DPtr = 0;
    if(!path) {
      ptr = getWasmBridge()._new_path2d();
    } else if(path instanceof Path2D) {
      ptr = getWasmBridge()._new_path2d_from_path(path.raw());
    } else if(typeof path === 'string') {
      let svg = new JsString(path);
      ptr = getWasmBridge()._new_path2d_form_svg(svg.raw())
    } else {
      throw new Error('unsupport Path2D type: ' + path);
    }
    super(new FinalizeHandler(()=> {
      getWasmBridge()._free(ptr);
    }))
    this.ptr = ptr;
  }

  raw(): number {
    return this.ptr;
  }

  addPath(path: Path2D, transform?: Matrix) {
    if(!transform) {
      this.bridge._path2d_add_path(this.raw(), path.raw(), 0);
    } else {
      this.bridge._path2d_add_path(this.raw(), path.raw(), transform.raw());
    }
  }

  arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, anticlockwise?: boolean) {
    const arr = new JsF32Array(6);
    arr.push(x, y, radius, startAngle, endAngle, anticlockwise ? 1 : 0);
    this.bridge._path2d_arc(this.raw(), arr.raw())
  }
  // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/arcTo
  // 从P0起点 P1 P2产生三角形，然后根据radius大小产生半径，P0会一直连线到这个半径
  arcTo(x1: number, y1: number, x2: number, y2: number, radius: number) {
    const arr = new JsF32Array(5);
    arr.push(x1, y1, x2, y2, radius);
    this.bridge._path2d_arc_to(this.raw(), arr.raw());
  }

  bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number) {
    const arr = new JsF32Array(6);
    arr.push(cp1x, cp1y, cp2x, cp2y, x, y);;
    this.bridge._path2d_bezier_curve_to(this.raw(), arr.raw());
  }

  closePath() {
    this.bridge._path2d_close_path(this.raw())
  }

  ellipse(x: number, y: number, radiusX: number, radiusY: number, rotation: number, startAngle: number, endAngle: number, anticlockwise?: boolean) {
    const arr = new JsF32Array(8);
    arr.push(x, y, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise ? 1.0 : 0);
    this.bridge._path2d_ellipse(this.raw(), arr.raw());
  }

  lineTo(x: number, y: number) {
    this.bridge._path2d_line_to(this.raw(), x, y);
  }

  moveTo(x: number, y: number) {
    this.bridge._path2d_move_to(this.raw(), x, y);
  }

  quadraticCurveTo(cpx: number, cpy: number, x: number, y: number) {
    const arr = new JsF32Array(4);
    arr.push(cpx, cpy, x, y);
    this.bridge._path2d_quadratic_curve_to(this.raw(), arr.raw());
  }

}