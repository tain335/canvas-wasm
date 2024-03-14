import { Context2D } from "./context";
import { FinalizeHandler, Raw } from "./finalize";
import { KImage } from "./image";
import { JsString } from "./jstypes";
import { getWasmBridge } from "./registry";

export class CanvasPattern extends Raw {

  constructor(ptr: CanvasPatternPtr) {
    super(new FinalizeHandler(()=> {
      getWasmBridge()._free(ptr);
    }))
    this.ptr = ptr;
  }


  static fromImage(img: KImage, repetition: string = "repeat") {
    let ptr = getWasmBridge()._new_canvas_pattern_from_image(img.raw(), (new JsString(repetition).raw()))
    return new CanvasPattern(ptr);
  }

  static fromContext(ctx: Context2D, repetition: string = "repeat") {
    let ptr = getWasmBridge()._new_canvas_pattern_from_canvas(ctx.raw(), (new JsString(repetition).raw()));
    return new CanvasPattern(ptr);
  }

}