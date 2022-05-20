export default [
  "save",
  "restore",
  "reset",
  "scale",
  "rotate",
  "translate",
  "transform",
  "getTransform",
  "setTransform",
  "resetTransform",
  "createLinearGradient",
  "createRadialGradient",
  "createConicGradient",
  "createPattern",
  "isPointInPath",   // hard to implement?
  "isPointInStroke", // hard to implement?
  "measureText",     // hard to implement?
  "setLineDash",
  "getLineDash",
  // In our implementation CanvasPath methods are "setters" for isPointInXXX...
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
