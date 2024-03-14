import { FinalizeHandler, Raw } from "./finalize";
import { getWasmBridge } from "./registry";

export class JsF32Array extends Raw {
  constructor(cap: number| JsF32ArrayPtr, fromPtr?: boolean) {
    let ptr: number;
    if(fromPtr) {
      ptr = cap;
    } else {
      ptr = getWasmBridge()._new_js_f32_array(cap);
    }
    super(new FinalizeHandler(()=> {
      getWasmBridge()._free(ptr);
    }));
    this.ptr = ptr;
  }

  static fromPtr(ptr: number): JsF32Array {
    return new JsF32Array(ptr, true);
  }

  push(...vals: number[]) {
    vals.forEach((v)=> {
      this.bridge._js_f32_array_push(this.ptr, v);
    })
  }

  len(): number {
    return this.bridge._js_f32_array_len(this.ptr);
  }

  get(index: number): number {
    return this.bridge._js_f32_array_get(this.ptr, index);
  }

  set(index: number, v: number) {
    this.bridge._js_f32_array_set(this.ptr, index, v);
  }

  raw(): JsF32ArrayPtr {
    return this.ptr;
  }

  toArray(): number[] {
    const arr: number[] = [];
    let len = this.len();
    for(let i = 0; i < len; i++) {
      arr[i] = this.get(i);
    }
    return arr;
  }
}

export class JsString extends Raw {
  constructor(str: string | StringPtr) {
    let ptr: StringPtr = 0;
    if(typeof str === "string") {
      ptr = getWasmBridge().stringToNewUTF8(str)
    } else {
      ptr = str;
    } 
    super(new FinalizeHandler(()=> {
      getWasmBridge()._free(ptr);
    }))
    this.ptr = ptr;
  }

  raw(): StringPtr {
    return this.ptr;
  }

  get value(): string {
    return getWasmBridge().UTF8ToString(this.ptr);
  }

  static fromPtr(ptr: StringPtr) {
    return new JsString(ptr);
  }
}

export class Dye extends Raw {
  constructor(dyePtr: DyePtr) {
    super(new FinalizeHandler(()=> {
      getWasmBridge()._free(dyePtr)
    }))
    this.ptr = dyePtr;
  }

  static fromColor(color: string): Dye {
    const str = new JsString(color);
    const dyePtr = getWasmBridge()._new_dye_from_color(str.raw());
    return new Dye(dyePtr);
  }

  static fromGrident(g: CanvasGradientPtr) {
    const dyePtr = getWasmBridge()._new_dye_from_gradient(g);
    return new Dye(dyePtr);
  }

  static fromPattern(p: CanvasPatternPtr) {
    const dyePtr = getWasmBridge()._new_dye_from_pattern(p);
    return new Dye(dyePtr);
  }

  raw(): DyePtr {
    return this.ptr;
  }
}

export class JsBuffer extends Raw {
  constructor(cap: number | JsBufferPtr, fromPtr?: boolean) {
    let ptr: number;
    if(fromPtr) {
      ptr = cap;
    } else {
      ptr = getWasmBridge()._new_js_f32_array(cap);
    }
    super(new FinalizeHandler(()=> {
      getWasmBridge()._free(ptr);
    }));
    this.ptr = ptr;
  }

  static fromPtr(ptr: number): JsBuffer {
    return new JsBuffer(ptr, true);
  }

  static fromBuffer(data: Uint8Array): JsBuffer {
    let buf = new JsBuffer(data.length)
    for(let i = 0; i < data.length; i++) {
      buf.push(data[i]);
    }
    return buf;
  }

  push(...vals: number[]) {
    vals.forEach((v)=> {
      this.bridge._js_buffer_push(this.ptr, v);
    })
  }

  len(): number {
    return this.bridge._js_buffer_len(this.ptr);
  }

  get(index: number): number {
    return this.bridge._js_buffer_get(this.ptr, index);
  }

  set(index: number, v: number) {
    this.bridge._js_buffer_set(this.ptr, index, v);
  }

  toBuffer(): Uint8Array {
    let len = this.len();
    const data = new Uint8Array(len);
    for(let i = 0; i < len; i++) {
      data[i] = this.get(i);
    }
    return data;
  }

  raw(): JsBufferPtr {
    return this.ptr;
  }
}

export class JsAnyArray extends Raw {
  constructor(cap: number | JsAnyArrayPtr, fromPtr?: boolean) {
    let ptr: number;
    if(fromPtr) {
      ptr = cap;
    } else {
      ptr = getWasmBridge()._new_js_any_array(cap);
    }
    super(new FinalizeHandler(()=> {
      getWasmBridge()._free(ptr);
    }));
    this.ptr = ptr;
  }

  static fromPtr(ptr: JsAnyArrayPtr): JsAnyArray {
    return new JsAnyArray(ptr, true)
  }

  push(...vals: number[]) {
    vals.forEach((v)=> {
      this.bridge._js_any_array_push(this.ptr, v);
    })
  }

  len(): number {
    return this.bridge._js_any_array_len(this.ptr);
  }

  get(index: number): number {
    return this.bridge._js_any_array_get(this.ptr, index);
  }

  set(index: number, v: number) {
    this.bridge._js_any_array_set(this.ptr, index, v);
  }

  raw(): JsF32ArrayPtr {
    return this.ptr;
  }
}

export class JsStrMap extends Raw {
  constructor() {
    let ptr = getWasmBridge()._new_js_str_map();
    super(new FinalizeHandler(()=> {
      getWasmBridge()._free(ptr);
    }));
    this.ptr = ptr;
  }

  insert(k: string, v: string) {
    this.bridge._js_str_map_insert(this.raw(), (new JsString(k)).raw(), (new JsString(v).raw()))
  }
  
  delete(k: string) {
    this.bridge._js_str_map_delete(this.raw(), (new JsString(k)).raw())
  }

  has(k: string): boolean {
    return this.bridge._js_str_map_has(this.raw(), (new JsString(k)).raw()) === 1;
  }

  clear() {
    this.bridge._js_str_map_clear(this.raw());
  }
}

export class JsImageData extends Raw {
  private _bufRef: JsBuffer;

  constructor(data: Uint8Array | ImageDataPtr, width?: number, height?: number) {
    if(data instanceof Uint8Array) {
      let bufRef = JsBuffer.fromBuffer(data);
      let ptr = getWasmBridge()._new_image_data(bufRef.raw(), width as number, height as number);
      super(new FinalizeHandler(()=> {
        getWasmBridge()._free(ptr);
      }))
      this._bufRef = bufRef;
      this.ptr = ptr;
    } else {
      let ptr = data as ImageDataPtr;
      super(new FinalizeHandler(()=> {
        getWasmBridge()._free(ptr);
      }))
      this._bufRef = JsBuffer.fromPtr(getWasmBridge()._image_data_get_data(ptr));
      this.ptr = ptr;
    }
   
  }

  static fromPtr(ptr: ImageDataPtr) {
    return new JsImageData(ptr);
  }

  get width() {
    return this.bridge._image_data_get_width(this.raw());
  }

  get height() {
    return this.bridge._image_data_get_height(this.raw());
  }

  get data() {
    if(this._bufRef) {
      return this._bufRef.toBuffer();
    }
    throw new Error("no data");
  }
}