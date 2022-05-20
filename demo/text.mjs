import CanvasLayer from "../source/CanvasLayer.mjs";
import { width, height } from "./settings.mjs";

const ctx         = new CanvasLayer();
const textLayer   = new CanvasLayer();
const shadowLayer = new CanvasLayer();

textLayer.font = "bold 70pt Courier,monospace";
textLayer.textBaseline = "top";
textLayer.fillText("FOO", 10, 0);
textLayer.fillText("BAR", 10, 70);

shadowLayer.shadowOffsetX = 10;
shadowLayer.shadowOffsetY = 10;
shadowLayer.shadowBlur    = 30;
shadowLayer.shadowColor   = "white";
shadowLayer.renderLayer(textLayer);
shadowLayer.globalCompositeOperation = "destination-out";
shadowLayer.shadowColor   = "transparent";
shadowLayer.renderLayer(textLayer);

let offset = 0;
let angle  = 0;
let prev   = performance.now();

function anim(now) {
  const delta = (now - prev) / (1000 / 60);
  prev = now;
  offset += delta * 1.5;

  ctx.reset(); // easily missed
  ctx.translate(width / 3, height / 3);

  ctx.renderLayer(textLayer);
  ctx.globalCompositeOperation = "source-atop";

  // rainbow
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = `hsl(${(i * (360 / 7)) + (offset % 360)}, 90%, 55%)`;
    ctx.fillRect(0, i * 20, 200, 20);
  }

  ctx.globalCompositeOperation = "source-over";

  angle += delta * (2 / 360);
  ctx.translate(80, 100);
  ctx.rotate(angle);
  ctx.translate(-80, -100);
  ctx.renderLayer(shadowLayer);

  requestAnimationFrame(anim);
}
requestAnimationFrame(anim);

export default ctx;
