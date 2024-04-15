export function info(...args: any[]) {
  console.info(...args)
}

export function debug(...args: any[]) {
  if(window.CANVAS_WASM_DEBUG) {
    console.debug(...args)
  }
}

export function warn(...args: any[]) {
  console.warn(...args)
}

export function error(...args: any[]) {
  console.error(...args)
}