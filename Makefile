EMSDK ?= ~/.asdf/installs/emsdk/$(shell asdf current emsdk | tr -s ' ' | cut -d ' ' -f 2)
BUILD = EMCC_CFLAGS="-s EXPORT_ALL=1 -s ENVIRONMENT=web -s SINGLE_FILE -s ALLOW_MEMORY_GROWTH=1 -s ERROR_ON_UNDEFINED_SYMBOLS=0 -s MAX_WEBGL_VERSION=2 -s MODULARIZE=1 -s EXPORT_NAME=createCanvasWasmModule -s EXPORTED_RUNTIME_METHODS=GL,cwrap,UTF8ToString,stringToNewUTF8" EMSDK=$(EMSDK) cargo build --target wasm32-unknown-emscripten 

.PHONY: build
build:
	$(BUILD)
	cp ./target/wasm32-unknown-emscripten/debug/canvas-wasm.js ./release/canvas-wasm.js

.PHONY: build_release
build_release:
	$(BUILD) --release
	cp ./target/wasm32-unknown-emscripten/release/canvas-wasm.js ./release/canvas-wasm.js

.PHONY: serve
serve:
	python3 -m http.server
