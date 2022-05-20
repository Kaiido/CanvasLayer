import CanvasLayer from "../source/CanvasLayer.mjs";
import { width, height } from "./settings.mjs";

const frames = [];

const ctx = new CanvasLayer();

function makeFrame() {
  const layer = new CanvasLayer();
  layer.fillStyle = "white";
  layer.beginPath();
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const radius = Math.random() * 3;
    layer.moveTo(x + radius, y);
    layer.arc(x, y, radius, 0, Math.PI * 2, false);
  }
  layer.fill();
  return { layer, alpha: 0, dir: 1 };
}

let prev = performance.now();
let lastPush = performance.now();
function anim(now) {
  const delta = Math.max((now - prev) / (1000 / 60), 0);
  prev = now;

  ctx.reset(); // easily missed, would make the layer's commands grow ever and ever

  if (now - lastPush > 1000) {
    frames.push(makeFrame());
    lastPush = now;
  }

  const ended = [];
  ctx.fillRect(0, 0, width, height);
  frames.forEach((frame, index) => {
    const { layer, alpha, dir } = frame;
    frame.alpha += delta * 0.01 * dir;
    if (frame.alpha >= 1) {
      frame.dir *= -1;
    }
    if (frame.alpha <= 0) {
      ended.push(index);
      return;
    }
    ctx.globalAlpha = alpha;
    ctx.renderLayer(layer);
  });
  ended.reverse().forEach((index) => {
    frames.splice(index, 1);
  });
  requestAnimationFrame(anim);
}
requestAnimationFrame(anim);

export default ctx;
