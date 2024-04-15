import { FinalizeHandler, Raw } from "./finalize";
import { Context2D } from "./context";
import { getWasmBridge, registerWasmBridge } from "./registry";
import { fetchBuffer } from "./utils";
import { JsBuffer, JsString } from "./jstypes";
import { debug } from "./logger";

function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement) {
  const width = canvas.clientWidth | 1;
  const height = canvas.clientHeight | 1;
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
    debug("canvas width: " + width + ", height: " + height);
    return true;
  }
  return false;
}

export class CanvasWasm extends Raw {
  private surfacePtr: SurfacePtr = 0;
  private context?: Context2D;
  constructor(public el: HTMLCanvasElement | OffscreenCanvas) {
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
      preserveDrawingBuffer: true,
    });
  
    // Register the context with emscripten
    // @ts-ignore
    const handle = bridge.GL.registerContext(context, { majorVersion: 2 });
    // @ts-ignore
    bridge.GL.makeContextCurrent(handle);
    surfacePtr = this.bridge._init_surface(el.width, el.height);
    this.surfacePtr = surfacePtr;
    canvasPtr = bridge._new_canvas(surfacePtr, el.width, el.height);
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

  set width(w: number) {
    this.bridge._canvas_set_width(this.raw(), w);
    getWasmBridge()._resize_surface(this.surfacePtr, this.width, this.height);
  }

  get width() {
    return this.bridge._canvas_get_width(this.raw());
  }

  set height(h: number) {
    this.bridge._canvas_set_height(this.raw(), h);
    getWasmBridge()._resize_surface(this.surfacePtr, this.width, this.height);
  }

  get height() {
    return this.bridge._canvas_get_height(this.raw());
  }

  resize() {
    if(this.el instanceof HTMLCanvasElement) {
      resizeCanvasToDisplaySize(this.el);
    }
    this.width = this.el.width;
    this.height = this.el.height;
    getWasmBridge()._resize_surface(this.surfacePtr, this.el.width, this.el.height);
  }


  flush() {
    if(this.context) {
      getWasmBridge()._render_to_surface(this.surfacePtr, this.context.raw());
    } else {
      throw new Error('no context');
    }
  }

  saveAs(format: 'pdf' | 'png' | 'jpeg', options?: {quality?: number, density?: number, matte?: string}) {
    if(this.context) {
      let f = (new JsString(format)).raw();
      let q = options?.quality ?? 1;
      let d = options?.density ?? 1;
      let m = (new JsString(options?.matte ?? '')).raw();
      let bufPtr = this.bridge._canvas_save_as(this.raw(), f, q, d, m);
      return JsBuffer.fromPtr(bufPtr).toBuffer();
    } else {
      throw new Error('no context');
    }
  }

  async loadFonts(alias?: string | string[], sources: string[] = []): Promise<any> {
    let _alias = '';
    if(typeof alias !== 'string') {
      sources = alias ?? [];
      _alias = '';
    } else {
      _alias = alias;
    }
    return Promise.all(sources.map(async (src)=> {
      const buffer = await fetchBuffer(src);
      this.loadFontFromBuffer(buffer, _alias);
    }))
  }

  loadFontFromBuffer(buf: Uint8Array, alias: string) {
    const jsbuff = new JsBuffer(buf.length);
    for(let i = 0; i < buf.length; i++) {
      jsbuff.push(buf[i]);
    }
    this.bridge._add_font_family(jsbuff.raw(), alias ? new JsString(alias).raw() : new JsString("_default").raw());
  }

  raw(): number {
    return this.ptr;
  }
}