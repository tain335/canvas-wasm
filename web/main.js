/**
 * Make a canvas element fit to the display window.
 */
// import * as canvasModule from "./canvas.js"

// function resizeCanvasToDisplaySize(canvas) {
//   const width = canvas.clientWidth | 1;
//   const height = canvas.clientHeight | 1;
//   if (canvas.width !== width || canvas.height !== height) {
//     canvas.width = width;
//     canvas.height = height;
//     return true;
//   }
//   return false;
// }

// // This loads and initialize our WASM module
// createRustSkiaModule().then((module) => {
//   canvasModule.init();
//   console.log(module)
//   // Create the WebGL context
//   let context;
//   const canvas = document.querySelector("#glcanvas");
//   context = canvas.getContext("webgl2", {
//     antialias: true,
//     depth: true,
//     stencil: true,
//     alpha: true,
//   });

//   // Register the context with emscripten
//   const handle = module.GL.registerContext(context, { majorVersion: 2 });
//   module.GL.makeContextCurrent(handle);

//   // Fit the canvas to the viewport
//   resizeCanvasToDisplaySize(canvas);

//   // Initialize Skia
//   const state = module._init(canvas.width, canvas.height);

//   // Draw a circle that follows the mouse pointer
//   window.addEventListener("click", (event) => {
//     // const canvasPos = canvas.getBoundingClientRect();

//     // const s = "hello中文";
//     // const ss = RustSkia.stringToNewUTF8(s)
//     // const result = RustSkia._test_string(ss);
//     // RustSkia._free(ss);
//     // const r = RustSkia.UTF8ToString(result);
//     // console.log("result:", r);
//     // RustSkia._free(r);

//     // const arrayData = [1, 2, 3, 4, 5];
//     // const arrayDataPtr = RustSkia._malloc(arrayData.length * 4);
//     // RustSkia.HEAP32.set(arrayData, arrayDataPtr / 4);
//     // RustSkia._test_arr(arrayDataPtr, arrayData.length)
//     // RustSkia._free(arrayDataPtr)

//     const canvas  = module._new_canvas();
//     const context = module._new_context(canvas);
//     let result = module._get_size(context)
//     let len = module._js_f32_array_len(result);
//     let width = module._js_f32_array_get(result, 1);
//     let height = module._js_f32_array_get(result, 0);
//     console.log(len, width, height);
//     const arr = module._new_js_f32_array();
//     module._js_f32_array_push(arr, 320);
//     module._js_f32_array_push(arr, 160);
//     module._set_size(context, arr);
//     result = module._get_size(context)
//     len = module._js_f32_array_len(result);
//     width = module._js_f32_array_get(result, 1);
//     height = module._js_f32_array_get(result, 0);
//     console.log(len, width, height);
//     // console.log(len);
//     // console.log("width:", RustSkia.HEAPF32[data >> 2])
//     // console.log("height:", RustSkia.HEAPF32[data >> 2 + 1])
//   });

//   // Make canvas size stick to the window size
//   window.addEventListener("resize", () => {
//     if (resizeCanvasToDisplaySize(canvas)) {
//       module._resize_surface(state, canvas.width, canvas.height);
//     }
//   });
// });

import * as canvasWasm from "../dist/index.js";

function testDrawText(canvas, context) {
   canvas.loadFont("./NotoSansTC-Regular.ttf", 'NotoSansTC').then(()=> {
    context.fillStyle = '#0000ff';
    context.font = 'italic bold 28px NotoSansTC';
    context.drawRichText("中文中文", 100, 100, 200);
  })
}

function testDrawImage(context) {
   const img = new Image();
    img.src = "./abc.jpeg";
    img.onload = ()=> {
      context.drawImage(img, 0, 0);
    }
}

function testDrawRect(context) {
  context.fillStyle = '#0000ff';
  context.fillRect(0, 0, 300, 300);
}

function testDrawLine(context) {
  context.lineWidth = 10;
  context.strokeStyle = "blue";
  context.moveTo(0, 0);
  context.lineTo(300, 300);
  context.stroke();
}

function testPath2D() {
  context.lineWidth = 4;
  context.strokeStyle = "blue";
  path.moveTo(180, 90);
  path.arcTo(180, 130, 110, 130, 130);
  context.stroke(path);
}

function testMeasureText(canvas, context) {
  canvas.loadFont("./NotoSansTC-Regular.ttf", 'NotoSansTC').then(()=> {
    context.fillStyle = '#0000ff';
    context.font = 'italic bold 28px NotoSansTC';
    const result = context.measureText("中文中文");
    console.log(result);
    // context.drawRichText("中文中文", 100, 100, 200);
  })
}

canvasWasm.initWasmBridge().then((RustSkia)=> {
  const el = document.querySelector("#glcanvas");
  canvasWasm.initCanvas(el).then((canvas)=> {
    const context = canvas.getContext('2d');
    testMeasureText(canvas, context);
    canvas.flush();
  });
});