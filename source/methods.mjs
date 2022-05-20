// CanvasState
const stateMethods = [
  "save",
  "restore",
  "reset",
  "isContextLost", // Isn't it meaningless?
  "renderLayer"
];
// CanvasTransform
const transformMethods = [
  "scale",
  "rotate",
  "translate",
  "transform",
  "getTransform",
  "setTransform",
  "resetTransform"
];
// CanvasFillStrokeStyles
const fillStyleMethods = [
  "createLinearGradient",
  "createRadialGradient",
  "createConicGradient",
  "createPattern"
];
// CanvasRect
const rectMethods = [
  "clearRect",
  "fillRect",
  "strokeRect"
];
// CanvasDrawPath
const drawPathMethods = [
  "beginPath",
  "fill",
  "stroke",
  "clip",
  "isPointInPath",   // hard to implement?
  "isPointInStroke"  // hard to implement?
];
// CanvasText
const textMethods = [
  "fillText",
  "strokeText",
  "measureText"      // hard to implement?
];
// CanvasDrawImage
const drawImageMethods = [
  "drawImage"
];
// CanvasPathDrawingStyles
const pathDrawingStyleMethods = [
  "setLineDash",
  "getLineDash"
];
// CanvasPath
const pathMethods = [
  "closePath",
  "moveTo",
  "lineTo",
  "quadraticCurveTo",
  "bezierCurveTo",
  "arcTo",
  "rect",
  "roundRect",
  "arc",
  "ellipse"
];

export default [
  ...stateMethods,
  ...transformMethods,
  ...fillStyleMethods,
  ...rectMethods,
  ...drawPathMethods,
  ...textMethods,
  ...drawImageMethods,
  ...pathDrawingStyleMethods,
  ...pathMethods
];
export {
  stateMethods,
  transformMethods,
  fillStyleMethods,
  rectMethods,
  drawPathMethods,
  textMethods,
  drawImageMethods,
  pathDrawingStyleMethods,
  pathMethods
};
