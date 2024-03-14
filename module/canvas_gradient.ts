import { FinalizeHandler, Raw } from "./finalize";
import { JsBuffer, JsString } from "./jstypes";
import { getWasmBridge } from "./registry";

export class CanvasGradient extends Raw {
  constructor(ptr: CanvasGradientPtr) {
    super(new FinalizeHandler(()=> {
      getWasmBridge()._free(ptr);
    }))
    this.ptr = ptr;
  }

  static createLinearGradient(x0: number, y0: number, x1: number, y1: number): CanvasGradient {
    const arr = new JsBuffer(4);
    arr.push(x0, y0, x1, y1);
    let ptr = getWasmBridge()._new_linear_gradient(arr.raw());
    return new CanvasGradient(ptr);
  }

  static createRadialGradient(x0: number, y0: number, r0: number, x1: number, y1: number, r1: number): CanvasGradient {
    const arr = new JsBuffer(6);
    arr.push(x0, y0, r0, x1, y1, r1);
    let ptr = getWasmBridge()._new_radial_gradient(arr.raw());
    return new CanvasGradient(ptr);
  }

  static createConicGradient(startAngle: number, x: number, y: number): CanvasGradient {
    const arr = new JsBuffer(3);
    arr.push(startAngle, x, y);
    let ptr = getWasmBridge()._new_conic_gradient(arr.raw());
    return new CanvasGradient(ptr);
  }

  addColorStop(offset: number, color: string) {
    getWasmBridge()._add_color_stop(this.raw(), offset, (new JsString(color)).raw())
  }
}