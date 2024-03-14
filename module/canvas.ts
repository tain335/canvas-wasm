import { FinalizeHandler, Raw } from "./finalize";
import { Context2D } from "./context";
import { getWasmBridge } from "./registry";
import { fetchBuffer } from "./utils";
import { JsBuffer, JsString } from "./jstypes";

function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement) {
  const width = canvas.clientWidth | 1;
  const height = canvas.clientHeight | 1;
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
    return true;
  }
  return false;
}

export class CanvasWasm extends Raw {
  private surfacePtr: SurfacePtr = 0;
  private context?: Context2D;
  constructor(public el: HTMLCanvasElement) {
    let canvasPtr: Ptr;
    let surfacePtr: Ptr;

    super(new FinalizeHandler(()=> {
      // TODO 可以挂载到canvas元素上避免回收
    }));
    let bridge = getWasmBridge();
    const context = el.getContext("webgl2", {
      antialias: true,
      depth: true,
      stencil: true,
      alpha: true,
    });
  
    // Register the context with emscripten
    // @ts-ignore
    const handle = bridge.GL.registerContext(context, { majorVersion: 2 });
    // @ts-ignore
    bridge.GL.makeContextCurrent(handle);

    resizeCanvasToDisplaySize(el)
    surfacePtr = this.bridge._init_surface(el.width, el.height);
    this.surfacePtr = surfacePtr;
    canvasPtr = bridge._new_canvas(surfacePtr);
    this.ptr = canvasPtr;
  }
  getContext(type: string): Context2D {
    if(type === '2d') {
      if(this.context) {
        return this.context;
      }
      this.context = new Context2D(this);
      return this.context;
    } else {
      throw new Error('unsupport type: ' + type);
    }
  }

  resize() {
    if (resizeCanvasToDisplaySize(this.el)) {
      getWasmBridge()._resize_surface(this.surfacePtr, this.el.width, this.el.height);
    }
  }

  flush() {
    if(this.context) {
      getWasmBridge()._render_to_surface(this.surfacePtr, this.context.raw());
    } else {
      throw new Error('no context');
    }
  }

  async loadFont(src: string, alias: string): Promise<void> {
    const buffer = await fetchBuffer(src);
    this.loadFontFromBuffer(buffer, alias);
  }

  loadFontFromBuffer(buf: Uint8Array, alias: string) {
    const jsbuff = new JsBuffer(buf.length);
    for(let i = 0; i < buf.length; i++) {
      jsbuff.push(buf[i]);
    }
    const aliasStr =  new JsString(alias);
    this.bridge._add_font_family(jsbuff.raw(), aliasStr.raw());
  }

  raw(): number {
    return this.ptr;
  }
}

export function initCanvas(el: HTMLCanvasElement): Promise<CanvasWasm> {
  return new Promise((resolve, reject)=> {
    createRustSkiaModule().then((module) => {
      resolve(new CanvasWasm(el))
    }).catch((err)=> {
      reject(err)
    })
  })
}