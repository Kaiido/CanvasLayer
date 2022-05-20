import { getSourceSize } from "./utils.mjs";

export function createBBox(x1, y1, x2, y2, matrix) {
  const left   = Math.min(x1, x2);
  const top    = Math.min(y1, y2);
  const right  = Math.max(x1, x2);
  const bottom = Math.max(y1, y2);
  const bbox    = { left, top, right, bottom };

  if (matrix) {
    /* eslint no-use-before-define: "off" */
    return transformBBox(bbox, matrix);
  }
  return bbox;
}
export function transformBBox(bbox, matrix) {
  const { left, top, right, bottom } = bbox;

  const top_left     = matrix.transformPoint({ x: left,  y: top });
  const top_right    = matrix.transformPoint({ x: right, y: top });
  const bottom_right = matrix.transformPoint({ x: right, y: bottom });
  const bottom_left  = matrix.transformPoint({ x: left,  y: bottom });

  const corners = [ top_left, top_right, bottom_left, bottom_right ];

  const transformedLeft   = Math.min(...corners.map(pt => pt.x));
  const transformedTop    = Math.min(...corners.map(pt => pt.y));
  const transformedRight  = Math.max(...corners.map(pt => pt.x));
  const transformedBottom = Math.max(...corners.map(pt => pt.y));

  return createBBox(
    Math.floor(transformedLeft),
    Math.floor(transformedTop),
    Math.ceil(transformedRight),
    Math.ceil(transformedBottom)
  );
}
export function cloneBBox(bbox) {
  return createBBox(bbox.left, bbox.top, bbox.right, bbox.bottom);
}
export function maxBBox(a, b) {
  return {
    left:   Math.min(a.left,   b.left),
    top:    Math.min(a.top,    b.top),
    right:  Math.max(a.right,  b.right),
    bottom: Math.max(a.bottom, b.bottom)
  };
}
export function clipBBox(a, b) {
  if (!a) {
    return b;
  }
  if (!b) {
    return a;
  }
  return {
    left:   Math.max(a.left,   b.left),
    top:    Math.max(a.top,    b.top),
    right:  Math.min(a.right,  b.right),
    bottom: Math.min(a.bottom, b.bottom)
  };
}
export function extendBBox(box, margins) {
  const { left, top, right, bottom } = box;
  return createBBox(
    left   - margins.x,
    top    - margins.y,
    right  + margins.x,
    bottom + margins.y
  );
}
/*
 * Will produce huge boxes when the lineWidth or miterLimit is big.
 * This is because we naively produce the "biggest" box any stroke could
 * possibly be inside the Path BBox.
 * The proper way would be to walk each path-segment,
 * and check all the line-joins angles. This isn't trivial.
 */
export function getStrokeBBox(box, context) {
  const strokeMargin = context.lineWidth * context.miterLimit / 2;
  const margins      = { x: strokeMargin, y: strokeMargin };
  return extendBBox(box, margins);
}
export function getShadowBBox(box, context) {
  const { shadowOffsetX,  shadowOffsetY, shadowBlur } = context;
  if (shadowBlur === 0) {
    return box;
  }
  const { left, top, right, bottom } = box;
  return createBBox(
    Math.min(left,   left   + shadowOffsetX - shadowBlur),
    Math.min(top,    top    + shadowOffsetY - shadowBlur),
    Math.max(right,  right  + shadowOffsetX + shadowBlur),
    Math.max(bottom, bottom + shadowOffsetY + shadowBlur)
  );
}
export function getFilterBBox(box, offsets) {
  const { left, top, right, bottom } = box;
  return createBBox(
    left   + offsets.left,
    top    + offsets.top,
    right  + offsets.right,
    bottom + offsets.bottom
  );
}
export function getTextBBox([ text, x, y ], context) {
  const metrics = context.measureText(text);
  const left   = metrics.actualBoundingBoxLeft   * -1;
  const top    = metrics.actualBoundingBoxAscent * -1;
  const right  = metrics.actualBoundingBoxRight;
  const bottom = metrics.actualBoundingBoxDescent;
  return createBBox(
    left   + x,
    top    + y,
    right  + x,
    bottom + y
  );
}
export function getDrawImageBBox(args, matrix) {
  /*
   * May fail with SVGImageElement
   * and with HTMLImageImageElement with a pixel density descriptor
   */
  if (args.length === 3) {
    const [ source, x1, y1 ] = args;
    const { width, height } = getSourceSize(source);
    return createBBox(x1, y1, x1 + width, y1 + height, matrix);
  }
  if (args.length === 5) {
    const [ , x1, y1, width, height ] = args;
    return createBBox(x1, y1, x1 + width, y1 + height, matrix);
  }
  if (args.length === 9) {
    const [ , , , , , x1, y1, width, height ] = args;
    return createBBox(x1, y1, x1 + width, y1 + height, matrix);
  }
  return createBBox(0, 0, 0, 0);
}
export function getPutImageDataBBox(args) {
  const [ { width, height }, x1, y1 ] = args;
  return createBBox(x1, y1, x1 + width, y1 + height);
}
