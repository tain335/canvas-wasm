import { registerWasmBridge } from "./registry"
export * from './canvas';
export * from './path2d';

export function initWasmBridge() {
  return new Promise((resolve, reject)=> {
    createCanvasWasmModule().then((module) => {
      resolve(registerWasmBridge(module))
    }).catch((err)=> {
      reject(err)
    })
  })
}