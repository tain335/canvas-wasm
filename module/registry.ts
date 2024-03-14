let bridge: WasmBridge | undefined;

export function registerWasmBridge(module: WasmBridge) {
  bridge = module;
  return module;
}

export function getWasmBridge(): WasmBridge {
  if(!bridge) {
    throw new Error("no init wasm bridge");
  }
  return bridge;
}