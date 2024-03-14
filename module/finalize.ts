import { getWasmBridge } from "./registry";

const registry = new FinalizationRegistry((heldValue) => {
  if(heldValue instanceof FinalizeHandler) {
    heldValue.finalize();
  }
});

export class FinalizeHandler {
  private called = false;
  constructor(private action: ()=> void) {}

  finalize() {
    if(!this.called) {
      this.action();
    } else {
      throw new Error("finalize cannot call more than one time")
    }
  }
}

export abstract class Finalize {
  constructor(protected handler: FinalizeHandler) {
    registry.register(this, handler);
  }

  finalize() {
    this.handler.finalize();
  }
}

export abstract class Raw extends Finalize {
  protected ptr: Ptr = 0;
  protected bridge: WasmBridge = getWasmBridge();

  raw(): Ptr {
    return this.ptr
  }
}