/*
 * Doesn't work... We need not only the clipping area but also where the source will go.
 * E.g. if we translate the target by 20, 20, then the actual box is
 * { width - 20, height - 20 }, if we scale by 2, 2, it's { width / 2, height / 2 }
 */

import map from "../weakmap.mjs";
import {
  pathMethods,
  transformMethods
} from "../methods.mjs";
import { createBBox, clipBBox, transformBBox, cloneBBox, maxBBox } from "./boxes.mjs";
function getPath(context, path) {
  if (path instanceof Path2D) {
    return path;
  }
  return map.get(context).innerPath;
}

function updateClipArea(context, ...args) {
  const path           = getPath(context, args[0]);
  const storage        = map.get(context);
  storage.clipArea     = clipBBox(storage.clipArea, path.getBBox());
}
function initInstance(context) {
  map.set(context, {
    innerPath:       new Path2D(),
    bufferPath:      new Path2D(),
    bufferPathDirty: false,
    clipArea:        null,
    states:          []
  });
}
function overwriteCanvasWidthHeight(canvas, context) {
  const proto = Object.getPrototypeOf(canvas);
  const { width, height } = Object.getOwnPropertyDescriptors(proto);
  Object.defineProperties(canvas, {
    width: {
      ...width,
      get: width.get,
      set: function (value) {
        initInstance(context);
        return width.set.call(this, value);
      }
    },
    height: {
      ...height,
      get: height.get,
      set: function (value) {
        initInstance(context);
        return height.set.call(this, value);
      }
    }
  });
}
function overwriteCanvasProto(constructor) {
  const proto = constructor.prototype;
  const { getContext } = proto;
  proto.getContext = function (...args) {
    const context = getContext.call(this, ...args);
    if (context && args[0] === "2d" && !map.has(context)) {
      initInstance(context);
      overwriteCanvasWidthHeight(this, context);
    }
    return context;
  };
}
function drawBufferPath(context) {
  const storage = map.get(context);
  const { bufferPathDirty, bufferPath, innerPath } = storage;
  if (bufferPathDirty) {
    innerPath.addPath(bufferPath, context.getTransform());
    storage.bufferPath      = new Path2D();
    storage.bufferPathDirty = false;
  }
}
function override2DContextProto(proto) {
  const {
    clip,
    save,
    restore,
    reset,
    beginPath
  } = proto;

  proto.clip = function (...args) {
    drawBufferPath(this);
    updateClipArea(this, args[0]);
    clip.call(this, ...args);
  };
  proto.save = function (...args) {
    const storage = map.get(this);
    const { clipArea } = storage;
    save.call(this, ...args);
    storage.states.push(clipArea ? cloneBBox(clipArea) : clipArea);
  };
  proto.restore = function (...args) {
    const storage = map.get(this);
    restore.call(this, ...args);
    storage.clipArea = storage.states.pop();
  };
  proto.reset = function (...args) {
    const storage = map.get(this);
    storage.clipArea = createBBox(-Infinity, -Infinity, Infinity, Infinity);
    storage.states.length = 0;
    storage.innerPath  = new Path2D();
    storage.bufferPath = new Path2D();
    storage.bufferPathDirty = false;
    reset?.call(this, ...args);
  };
  proto.beginPath = function (...args) {
    const storage = map.get(this);
    storage.innerPath  = new Path2D();
    storage.bufferPath = new Path2D();
    storage.bufferPathDirty = false;
    beginPath.call(this, ...args);
  };
  /*
   * We trace in the buffer for now
   */
  pathMethods.forEach((key) => {
    const original = proto[key];
    proto[key] = function (...args) {
      const storage = map.get(this);
      storage.bufferPath[key](...args);
      storage.bufferPathDirty = true;
      original.call(this, ...args);
    };
  });
  /*
   * Every time we either draw the path or change the CTM
   * We apply the transformed buffer path to innerPath
   */
  [ "fill", "stroke" ].concat(transformMethods).forEach((key) => {
    if (key === "getTransform") {
      return;
    }
    const original = proto[key];
    proto[key] = function (...args) {
      drawBufferPath(this);
      original.call(this, ...args);
    };
  });
}

if (typeof CanvasRenderingContext2D === "function") {
  override2DContextProto(CanvasRenderingContext2D.prototype);
}
if (typeof OffscreenCanvasRenderingContext2D === "function") {
  override2DContextProto(OffscreenCanvasRenderingContext2D.prototype);
}
if (typeof HTMLCanvasElement === "function") {
  overwriteCanvasProto(HTMLCanvasElement);
}
if (typeof OffscreenCanvas === "function") {
  overwriteCanvasProto(OffscreenCanvas);
}

export default function getTargetBox(target) {
  if (!map.has(target)) {
    return target;
  }
  const { canvas } = target;
  const { clipArea } = map.get(target);
  const mat = target.getTransform().inverse();
  const clippingBox = clipArea &&
    maxBBox(
      transformBBox(clipArea, mat),
      createBBox(0, 0, 0, 0)
    );
  const bitmapBox = createBBox(0, 0, canvas.width, canvas.height, mat);
  return clippingBox ? clipBBox(bitmapBox, clippingBox) : bitmapBox;
}
