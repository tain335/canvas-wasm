import { CanvasWasm } from './canvas';
import { registerWasmBridge } from './registry';
import createCanvasWasmModule from '../release/canvas-wasm.js';

export * from './canvas';
export * from './path2d';

export function initCanvas(el: HTMLCanvasElement | OffscreenCanvas): Promise<CanvasWasm> {
  return createCanvasWasmModule().then((m: any) => {
    registerWasmBridge(m);
    return new CanvasWasm(el)
  });
}