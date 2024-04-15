const cache: { variant: Record<string, any>} = { variant:{} };
const parameterizedRE = /([\w\-]+)\((.*?)\)/;
let m;

const alternatesMap: Record<string, string> = {
  "stylistic": "salt #",
  "styleset": "ss##",
  "character-variant": "cv##",
  "swash": "swsh #",
  "ornaments": "ornm #",
  "annotation": "nalt #",
}



function splitBy(s: string, r: RegExp) {
  return s.split(r) ?? [];
}

export const weightMap: Record<string, number> = {
  "lighter":300,
  "normal":400,
  "bold":700,
  "bolder":800
}

export const featureMap: Record<string, string[]> = {
  "normal": [],

  // font-variant-ligatures
  "common-ligatures": ["liga", "clig"],
  "no-common-ligatures": ["-liga", "-clig"],
  "discretionary-ligatures": ["dlig"],
  "no-discretionary-ligatures": ["-dlig"],
  "historical-ligatures": ["hlig"],
  "no-historical-ligatures": ["-hlig"],
  "contextual": ["calt"],
  "no-contextual": ["-calt"],

  // font-variant-position
  "super": ["sups"],
  "sub": ["subs"],

  // font-variant-caps
  "small-caps": ["smcp"],
  "all-small-caps": ["c2sc", "smcp"],
  "petite-caps": ["pcap"],
  "all-petite-caps": ["c2pc", "pcap"],
  "unicase": ["unic"],
  "titling-caps": ["titl"],

  // font-variant-numeric
  "lining-nums": ["lnum"],
  "oldstyle-nums": ["onum"],
  "proportional-nums": ["pnum"],
  "tabular-nums": ["tnum"],
  "diagonal-fractions": ["frac"],
  "stacked-fractions": ["afrc"],
  "ordinal": ["ordn"],
  "slashed-zero": ["zero"],

  // font-variant-east-asian
  "jis78": ["jp78"],
  "jis83": ["jp83"],
  "jis90": ["jp90"],
  "jis04": ["jp04"],
  "simplified": ["smpl"],
  "traditional": ["trad"],
  "full-width": ["fwid"],
  "proportional-width": ["pwid"],
  "ruby": ["ruby"],

  // font-variant-alternates (non-parameterized)
  "historical-forms": ["hist"],
}

export async function fetchBuffer(src: string): Promise<Uint8Array> {
  const fontArrayBuffer = await fetch(src).then(response => response.arrayBuffer());
  return new Uint8Array(fontArrayBuffer);
}

export function parseCornerRadii(r: any){
  r = [r].flat()
         .map(n => n instanceof DOMPoint ? n : new DOMPoint(n, n))
         .slice(0, 4)

  if (r.some((pt: DOMPoint) => !Number.isFinite(pt.x) || !Number.isFinite(pt.y))){
    return null // silently abort
  }else if (r.some((pt: DOMPoint) => pt.x < 0 || pt.y < 0)){
    throw new Error("Corner radius cannot be negative")
  }

  return r.length == 1 ? [r[0], r[0], r[0], r[0]]
       : r.length == 2 ? [r[0], r[1], r[0], r[1]]
       : r.length == 3 ? [r[0], r[1], r[2], r[1]]
       : r.length == 4 ? [r[0], r[1], r[2], r[3]]
       : [0, 0, 0, 0].map(n => new DOMPoint(n, n))
}

export function parseVariant(str: string){
  if (cache.variant[str] === undefined ){
    let variants = [],
        features: any = {on: [], off:[] };

    for (let token of splitBy(str, /\s+/)){
      if (token == 'normal'){
        return {variants:[token], features:{on:[], off:[]}}
      }else if (token in featureMap){
        featureMap[token].forEach(feat => {
          if (feat[0] == '-') features.off.push(feat.slice(1))
          else features.on.push(feat)
        })
        variants.push(token);
      }else if (m = parameterizedRE.exec(token)){
        let subPattern = alternatesMap[m[1]],
            subValue = Math.max(0, Math.min(99, parseInt(m[2], 10))),
            [feat, val] = subPattern.replace(/##/, String((subValue < 10 ? '0'+subValue : subValue)))
                             .replace(/#/, String(Math.min(9, subValue))).split(' ');
        if (typeof val=='undefined') features.on.push(feat)
        else features[feat] = parseInt(val, 10)
        variants.push(`${m[1]}(${subValue})`)
      }else{
        throw new Error(`Invalid font variant "${token}"`)
      }
    }

    cache.variant[str] = {variant: variants.join(' '), features: features };
  }

  return cache.variant[str];
}