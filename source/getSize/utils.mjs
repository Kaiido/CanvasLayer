import {
  createBBox,
  maxBBox,
  extendBBox
} from "./boxes.mjs";

function getUnitMultiplier(unit) {
  switch (unit) {
    case "px": return 1;
    default: return 0;
  }
}
function toCSSPx(str) {
  if (!str) {
    return 0;
  }
  const [ , value, unit ] = str.match(/^([+-]?(?:\d+|\d*\.\d+))([a-z]*|%)$/);
  const mult  = getUnitMultiplier(unit);
  return value * mult;
}
function parseShadowOffsetParams(params) {
  if (!params) {
    return [ 0, 0 ];
  }
  let [ x, y ] = params.split(/\s+/);
  return [
    toCSSPx(x),
    toCSSPx(y)
  ];
}
function parseBlurValue(params) {
  if (!params) {
    return 0;
  }
  const value = params.match(/\d/);
  return toCSSPx(value);
}
function isInstanceOfType(type) {
  const constructor = globalThis[type];
  return constructor && (this instanceof constructor);
}

export function getSourceSize(source) {
  const sourceIs = isInstanceOfType.bind(source);
  if (sourceIs("HTMLImageElement")) {
    return {
      width:  source.naturalWidth,
      height: source.naturalHeight
    };
  }
  else if (sourceIs("HTMLVideoElement")) {
    return {
      width: source.videoWidth,
      height: source.videoHeight
    };
  }
  else if (sourceIs("SVGImageElement")) {
    // no real synchronous way to know the intrinsic size of an SVGImageElement...
    return {
      width: NaN,
      height: NaN
    };
  }
  else if (
    sourceIs("HTMLCanvasElement") ||
    sourceIs("OffscreenCanvas") ||
    sourceIs("ImageBitmap") ||
    sourceIs("ImageData")
  ) {
    return {
      width: source.width,
      height: source.height
    };
  }
  return {
    width: NaN,
    height: NaN
  };
}
export function parseFilterOffset(filterStr) {
  let box = createBBox(0, 0, 0, 0);

  const drop_shadows = filterStr.matchAll(/drop-shadow\((.*?)\)/g);
  for (const params of drop_shadows) {
    const [ offsetX, offsetY ] = parseShadowOffsetParams(params?.[1]);
    box = maxBBox(box, createBBox(offsetX, offsetY, offsetX, offsetY));
  }

  let maxBlur = 0;
  const blurs = filterStr.match(/blur\((.*?)\)/g) || [];
  for (const params of blurs) {
    maxBlur = Math.max(maxBlur, parseBlurValue(params?.[1]));
  }

  return extendBBox(box, { x: maxBlur, y: maxBlur });
}
export function transformPath2D(source, matrix) {
  const newPath = new Path2D();
  newPath.addPath(source, matrix);
  return newPath;
}
