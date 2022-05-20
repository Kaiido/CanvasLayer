import map from "./weakmap.mjs";
import getMagicalSizeFromCommands from "./getSize/getSize.mjs";

export default function renderLayer(target) {
  const { context, commands } = map.get(this);
  const { canvas } = context;
  const { width, height } = getMagicalSizeFromCommands(this, target);
  if (!width || !height) {
    return;
  }
  canvas.width = width;
  canvas.height = height;
  commands.forEach(([ type, key, args ]) => {
    switch (type) {
      case "method": context[key].call(context, ...args); break;
      case "setter": context[key] = args[0];
    }
  });
  target.drawImage(canvas, 0, 0);
  canvas.width = canvas.height = 0; // clear as much memory as we can
}
