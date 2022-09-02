import "../node_modules/path2d-inspection/source/path2D-inspection.mjs";
import methods from "./methods.mjs";
import attrs from "./attributes.mjs";
import getterSetters from "./getterSetters.mjs";
import renderLayerOnContext from "./renderLayer.mjs";
import map from "./weakmap.mjs";

class CanvasLayer {
  constructor() {
    const canvas = typeof OffscreenCanvasRenderingContext2D === "function"
      ? new OffscreenCanvas(1, 1)
      : Object.assign(
        document.createElement("canvas"),
        { width: 1, height: 1 }
      );
    const commands = [];
    const context  = canvas.getContext("2d");
    const renderer = renderLayerOnContext.bind(this);
    const layersList = new Set();
    map.set(this, { commands, context, renderer, layersList });
  }
  clone() {
    const newLayer = new CanvasLayer();
    const { commands, layersList } = map.get(this);
    const newMap = map.get(newLayer);
    newMap.commands = commands.slice();
    newMap.layersList = new Set(...layersList.entries());
    return newLayer;
  }
}
methods.forEach((key) => {
  CanvasLayer.prototype[key] = function (...args) {
    const { commands, context } = map.get(this);
    commands.push([ "method", key, args ]);
    if (key === "reset") {
      commands.length = 0;
    }
    if (getterSetters.includes(key)) {
      return context[key](...args);
    }
    return undefined;
  };
});
attrs.forEach((key) => {
  Object.defineProperty(CanvasLayer.prototype, key, {
    /*
     * I must admit this feels a bit weird...
     * We can't get other getNNN methods to work properly
     * without having the setNNN methods being called immediately too.
     * So why should getters work?
     * Maybe that would be simpler to make it return undefined?
     * Some code may very well do things like
     *   ctx.fillStyle = ctx.createRadialGradient(...)
     *   ctx.fillStyle.addColorStop(0, "red");
     */
    get: function () {
      return map.get(this).context[key];
    },
    set: function (val) {
      const { context, commands } = map.get(this);
      context[key] = val;
      commands.push([ "setter", key, [ val ] ]);
    }
  });
});
CanvasLayer.prototype.renderLayer = function (layer) {
  const { commands, layersList } = map.get(this);
  const othersList = map.get(layer).layersList;
  [ ...othersList ].forEach((layer) => {
    if (map.get(layer).layersList.has(this)) {
      throw new TypeError("cyclic CanvasLayer value");
    }
    layersList.add(layer);
  });
  layersList.add(layer);
  if (othersList.has(this) || layersList.has(this)) {
    throw new TypeError("cyclic CanvasLayer value");
  }
  commands.push([ "method", "renderLayer", [ layer ] ]);
};


function renderLayer(layer) {
  map.get(layer).renderer.call(layer, this);
}
if (typeof CanvasRenderingContext2D === "function") {
  CanvasRenderingContext2D.prototype.renderLayer = renderLayer;
}
if (typeof OffscreenCanvasRenderingContext2D === "function") {
  OffscreenCanvasRenderingContext2D.prototype.renderLayer = renderLayer;
}

export default CanvasLayer;
