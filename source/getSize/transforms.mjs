/*
 * Utilities to map CanvasRenderingContext2D method calls
 * to a DOMMatrix
 *
 */
function buildMatrixString(args) {
  return `matrix(${ args.slice(0, 6).join() })`;
}
const transforms = {
  rotate(rad) {
    this.rotateSelf(rad * (180 / Math.PI));
  },
  scale(h, v) {
    this.scaleSelf(h, v);
  },
  translate(x, y) {
    this.translateSelf(x, y);
  },
  transform(...args) {
    this.multiplySelf(new DOMMatrix(buildMatrixString(args)));
  },
  setTransform(...args) {
    this.setMatrixValue(buildMatrixString(args));
  },
  resetTransform() {
    this.setMatrixValue(buildMatrixString([ 1, 0, 0, 1, 0, 0 ]));
  }
};

export default transforms;
