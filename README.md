# CanvasLayer
A prototype of what could be a `CanvasLayer` interface for the HTML Canvas 2D API.

This prototype explores a way to create "layers" for the Canvas 2D API that can be rendered in a single pass, allowing for filters, compositing etc. to be applied all at once on several drawing operations (while currently said operations apply to single drawing operations). See https://github.com/whatwg/html/issues/7329 for the specs discussion.  
This project aims at exploring if the CanvasLayer interface design would be ergonomic and if it is even implementable.

## Interface definition:

```webIDL
interface mixin CanvasState {
(+)  undefined renderLayer(CanvasLayer layer);
}

interface CanvasLayer {
  constructor();
  CanvasLayer clone();
}
CanvasLayer includes CanvasState;
CanvasLayer includes CanvasTransform;
CanvasLayer includes CanvasCompositing;
CanvasLayer includes CanvasImageSmoothing;
CanvasLayer includes CanvasFillStrokeStyles;
CanvasLayer includes CanvasShadowStyles;
CanvasLayer includes CanvasFilters;
CanvasLayer includes CanvasRect;
CanvasLayer includes CanvasDrawPath;
CanvasLayer includes CanvasText;
CanvasLayer includes CanvasDrawImage;
CanvasLayer includes CanvasPathDrawingStyles;
CanvasLayer includes CanvasTextDrawingStyles;
CanvasLayer includes CanvasPath;
```

## Simple usage:

```js
import CanvasLayer from "../bundles/CanvasLayer.min.mjs";

const layer = new CanvasLayer();
layer.fillRect(30, 30, 40, 40);
// do more drawings on the layer
// then when we want to render on the main canvas
ctx.globalAlpha = 0.5;
ctx.filter = "blur(5px)";
ctx.renderLayer(layer); // draws "layer" with the current globalAlpha and filter
```

## Can I use this for my own project?
We don't recommend it, no. This project is really just a prototype, it doesn't aim at being any performant, it will probably not correspond to what will be specced and we didn't conduct many tests.  
Moreover, it depends on an other unstable prototype ([Path2D-open-data](https://github.com/Kaiido/path2d-open-data)) which suffers from the same drawbacks.  

However we'd be more than grateful if you want to test this prototype and give us feedback.

## Live Examples

A quite complex one is accessible at https://glitch.com/edit/#!/canvaslayer-proto and a very simple playground at https://jsfiddle.net/gwzma4c5/