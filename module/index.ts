import { CanvasWasm } from './canvas';
import { registerWasmBridge } from './registry';

export * from './canvas';
export * from './path2d';

export function initCanvas(el: HTMLCanvasElement | OffscreenCanvas): Promise<CanvasWasm> {
  // @ts-ignore
  return import('../release/canvas-wasm.js').then((mod)=> {
    return mod.default().then((m: any) => {
      registerWasmBridge(m);
      return new CanvasWasm(el)
    });
  })
}