/*
 * The most "magical" part,
 * where we try to find out what will be the size of our layer canvas before we draw it.
 * This still doesn't account for the possible "target" size, so what we have here
 * is always the "maximum" box. Determining how that box will map on the target is not as
 * trivial as we'd like it to be.
 * This currently will produce huge boxes for strokes with big line-widths,
 * and doesn't account for SVG filters nor relative units in blur() & drop-shadow() filters.
 */

import map from "../weakmap.mjs";
import { pathMethods } from "../methods.mjs";
import {
  transformBBox,
  createBBox,
  cloneBBox,
  maxBBox,
  clipBBox,
  getStrokeBBox,
  getShadowBBox,
  getFilterBBox,
  getTextBBox,
  getDrawImageBBox,
  getPutImageDataBBox
} from "./boxes.mjs";
import {
  parseFilterOffset,
  transformPath2D
} from "./utils.mjs";
import transforms from "./transforms.mjs";
import getTargetBox from "./getTargetBox.mjs";

export default function getMagicalSizeFromCommands(layer, target) {
  const targetBox = getTargetBox(target);
  const { commands, context } = map.get(layer);
  const stateStorage = [];

  let matrix         = new DOMMatrix();
  let innerPath      = new Path2D();
  let clippingBox    = createBBox(-Infinity, -Infinity, Infinity, Infinity);
  let filterOffset   = createBBox(0, 0, 0, 0);
  let layerBox     = createBBox(0, 0, 0, 0);

  // We reset the context here so that we can use all its getters directly
  // (mainly for text related properties)
  if (context.reset) {
    context.reset();
  }
  else {
    context.canvas.width += 0;
  }

  for (const [ type, key, args ] of commands) {
    if (type === "setter") {
      context[key] = args[0];
      if (key === "filter") {
        filterOffset = parseFilterOffset(args[0]);
      }
    }
    if (type !== "method") {
      continue;
    }
    else if (key === "reset") {
      // We should not come here
      // since 'reset' clears the previous commands.
      innerPath = new Path2D();
      transforms.resetTransform.call(matrix);
      layerBox = createBBox(0, 0, 0, 0);
    }
    else if (key === "beginPath") {
      innerPath = new Path2D();
    }
    else if (key === "save") {
      stateStorage.push({
        clippingBox: clippingBox && cloneBBox(clippingBox),
        matrix: new DOMMatrix(matrix)
      });
    }
    else if (key === "restore") {
      const state = stateStorage.pop();
      if (state) {
        ({ clippingBox, matrix } = state);
      }
    }
    else if (key === "clip") {
      clippingBox = (args[0] instanceof Path2D ? args[0] : innerPath).getBBox();
    }
    else if (key in transforms) {
      transforms[key].call(matrix, ...args);
    }
    else if (pathMethods.includes(key)) {
      // Very highly probable perfs bottleneck
      // Doing the transforms ourselves might be faster but... that's just a P.O.C.
      const tempPath = new Path2D();
      tempPath[key](...args);
      innerPath.addPath(tempPath, matrix);
    }
    else if (key === "stroke") {
      const path = args[0] instanceof Path2D
        ? transformPath2D(args[0], matrix)
        : innerPath;
      const strokeBox      = getStrokeBBox(path.getBBox(), context);
      const transformedBox = transformBBox(strokeBox, matrix);
      const filterBox      = getFilterBBox(transformedBox, filterOffset);
      const shadowBox      = getShadowBBox(filterBox, context);
      const clippedBox     = clipBBox(shadowBox, clippingBox);
      layerBox = maxBBox(layerBox, clippedBox);
    }
    else if (key === "fill") {
      const path = args[0] instanceof Path2D
        ? transformPath2D(args[0], matrix)
        : innerPath;
      const transformedBox = transformBBox(path.getBBox(), matrix);
      const filterBox      = getFilterBBox(transformedBox, filterOffset);
      const shadowBox      = getShadowBBox(filterBox, context);
      const clippedBox     = clipBBox(shadowBox, clippingBox);
      layerBox = maxBBox(layerBox, clippedBox);
    }
    else if (key === "fillRect") {
      const [ x1, y1, width, height ] = args;
      const rectBox    = createBBox(x1, y1, x1 + width, y1 + height, matrix);
      const filterBox  = getFilterBBox(rectBox, filterOffset);
      const shadowBox  = getShadowBBox(filterBox, context);
      const clippedBox = clipBBox(shadowBox, clippingBox);
      layerBox = maxBBox(layerBox, clippedBox);
    }
    else if (key === "strokeRect") {
      const [ x1, y1, width, height ] = args;
      const rectBox        = createBBox(x1, y1, x1 + width, y1 + height);
      const strokeBox      = getStrokeBBox(rectBox, context);
      const transformedBox = transformBBox(strokeBox, matrix);
      const filterBox      = getFilterBBox(transformedBox, filterOffset);
      const shadowBox      = getShadowBBox(filterBox, context);
      const clippedBox     = clipBBox(shadowBox, clippingBox);
      layerBox = maxBBox(layerBox, clippedBox);
    }
    else if (key === "fillText") {
      const textBox        = getTextBBox(args, context);
      const transformedBox = transformBBox(textBox, matrix);
      const filterBox      = getFilterBBox(transformedBox, filterOffset);
      const shadowBox      = getShadowBBox(filterBox, context);
      const clippedBox     = clipBBox(shadowBox, clippingBox);
      layerBox = maxBBox(layerBox, clippedBox);
    }
    else if (key === "strokeText") {
      const textBox        = getTextBBox(args, context);
      const strokeBox      = getStrokeBBox(textBox, context);
      const transformedBox = transformBBox(strokeBox, matrix);
      const filterBox      = getFilterBBox(transformedBox, filterOffset);
      const shadowBox      = getShadowBBox(filterBox, context);
      const clippedBox     = clipBBox(shadowBox, clippingBox);
      layerBox = maxBBox(layerBox, clippedBox);
    }
    else if (key === "drawImage") {
      const bbox      = getDrawImageBBox(args, matrix);
      const filterBox = getFilterBBox(bbox, filterOffset);
      const shadowBox = getShadowBBox(filterBox, context);
      layerBox = maxBBox(layerBox, clipBBox(shadowBox, clippingBox));
    }
    else if (key === "putImageData") {
      const bbox = getPutImageDataBBox(args);
      layerBox = maxBBox(layerBox, bbox);
    }
    else if (key === "renderLayer") {
      const { width, height } = getMagicalSizeFromCommands(args[0], clippingBox);
      const sourceBox   = createBBox(0, 0, width, height, matrix);
      const filterBox  = getFilterBBox(sourceBox, filterOffset);
      const shadowBox  = getShadowBBox(filterBox, context);
      const clippedBox = clipBBox(shadowBox, clippingBox);
      layerBox = maxBBox(layerBox, clippedBox);
    }
  }

  layerBox.left = Math.max(layerBox.left, 0);
  layerBox.top  = Math.max(layerBox.top,  0);

  const finalBBox = clipBBox(targetBox,  layerBox);

  return {
    width:  finalBBox.right  - finalBBox.left,
    height: finalBBox.bottom - finalBBox.top
  };
}
