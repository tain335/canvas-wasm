import { CanvasWasm } from "./canvas";
import { FinalizeHandler, Raw } from "./finalize";
import { JsBuffer } from "./jstypes";
import { getWasmBridge } from "./registry";

function createJsBufferFromBase64(dataURL: string): JsBuffer {
  var BASE64_MARKER = ';base64,';
  if (dataURL.indexOf(BASE64_MARKER) == -1) {
    throw new Error('only support base64');
  }
  var parts = dataURL.split(BASE64_MARKER);
  var raw = window.atob(parts[1]);
  var rawLength = raw.length;
  const jsbuff = new JsBuffer(rawLength);

  for (var i = 0; i < rawLength; ++i) {
    jsbuff.push(raw.charCodeAt(i))
  }

  return jsbuff
}

export class KImage extends Raw {

  constructor(ptr?: ImagePtr) {
    let p: ImagePtr = 0;
    if(ptr) {
      p = ptr;
    } else {
      p = getWasmBridge()._new_image();
    }
    super(new FinalizeHandler(()=> {
      getWasmBridge()._free(p);
    }))
    this.ptr = p;
  }

  static fromPtr(ptr: ImagePtr) {
    return new KImage(ptr);
  }

  get width() {
    return getWasmBridge()._image_data_get_width(this.raw());
  }

  get height() {
    return getWasmBridge()._image_data_get_height(this.raw());
  }

  static fromImage(image: HTMLImageElement | SVGImageElement | HTMLVideoElement | HTMLCanvasElement | VideoFrame | ImageBitmap | OffscreenCanvas | CanvasWasm): KImage {
    if(image instanceof CanvasWasm) {
      const ctx = image.getContext('2d');
      return this.fromPtr(getWasmBridge()._get_image(ctx.raw()))
    } else {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      let width = 0;
      let height = 0;
      if(image instanceof VideoFrame) {
        width = image.displayWidth;
        height = image.displayHeight;
      } else if(image instanceof SVGImageElement) {
        let {width: w, height: h} =  image.getBoundingClientRect();
        width = w;
        height = h;
      } else {
        width = image.width;
        height = image.height;
      }
      canvas.width = width
      canvas.height = height;
      if(context) {
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL('image/png');
        const jsbuff = createJsBufferFromBase64(base64);
        const img = new KImage();
        getWasmBridge()._image_set_data(img.raw(), jsbuff.raw());
        return img;
      } else {
        throw new Error('canvas context cannot init');
      }
    }
  }

  static fromBuffer(binaryData: Uint8Array): KImage {
    const jsbuff = new JsBuffer(binaryData.length);
    for(let i = 0; i < binaryData.length; i++) {
      jsbuff.push(binaryData[i]);
    }
    const img = new KImage();
    getWasmBridge()._image_set_data(img.raw(), jsbuff.raw());
    return img;
  }

  // set
  raw(): number {
    return this.ptr
  }
}
