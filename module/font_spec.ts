import { FinalizeHandler, Raw } from "./finalize";
import { JsAnyArray, JsStrMap, JsString } from "./jstypes";
import { getWasmBridge } from "./registry";

export enum FontWidth {
  ULTRA_CONDENSED = "ultra-condensed",
  EXTRA_CONDENSED = "extra-condensed",
  CONDENSED = "condensed",
  SEMI_CONDENSED = "semi-condensed",
  SEMI_EXPANDED = "semi-expanded",
  EXPANDED = "expanded",
  EXTRA_EXPANDED = "extra-expanded",
  ULTRA_EXPANDED = "ultra-expanded",
  NORMAL = "normal"
}

export enum FonSlant {
  Italic = "italic",
  Oblique = "oblique",
  Normal = "normal"
}

export class FontSpec extends Raw {
  familes: string[] = [];
  size: number = 0;
  weight: number = 0;
  leading: number = 0;
  width: FontWidth = FontWidth.NORMAL;
  slant: FonSlant = FonSlant.Normal;
  canonical: string = "";
  variant: string = "";
  features: Map<string, "on" | "off" | number> = new Map();

  constructor() {
    let ptr: FontSpecPtr = 0;
    ptr = getWasmBridge()._new_font_spec();
    super(new FinalizeHandler(()=> {
      getWasmBridge()._free(ptr);
    }))
    this.ptr = ptr;
    this.setFamiles(...this.familes);
    this.setSize(this.size);
    this.setStyle(this.weight, this.width, this.slant);
    this.setLeading(this.leading);
    this.setCanonical(this.canonical);
    this.setVariant(this.variant);
  }

  setFamiles(...familes: string[]) {
    const strs = familes.map((s)=> new JsString(s));
    const arr = new JsAnyArray(strs.length);
    strs.forEach((s)=> {
      arr.push(s.raw());
    })
    this.bridge._font_spec_set_families(this.raw(), arr.raw());
  }

  setSize(size: number) {
    this.bridge._font_spec_set_size(this.raw(), size);
  }

  setLeading(leading: number) {
    this.bridge._font_spec_set_leading(this.raw(), leading);
  }

  setStyle(weight: number, width: FontWidth, slant: FonSlant) {
    this.bridge._font_spec_set_style(this.raw(), weight, (new JsString(width)).raw(), (new JsString(slant).raw()))
  }

  setCanonical(canonical: string) {
    this.bridge._font_spec_set_canonical(this.raw(), (new JsString(canonical).raw()));
  }

  setVariant(variant: string) {
    this.bridge._font_spec_set_variant(this.raw(), (new JsString(variant)).raw());
  }

  setFeatures(features: Map<string, "on" | "off" | number>) {
    const map = new JsStrMap();
    features.forEach((v, k)=> {
      map.insert(k, String(v))
    });
    this.bridge._font_spec_set_features(this.raw(), map.raw());
  }
}