// jsPDF optionally imports canvg for addSvgAsImage, which CrossFire never uses.
// Aliased in vite.config.ts so the PDF export does not ship canvg and core-js.
export const Canvg = {
  fromString() { throw new Error('SVG rendering is not available in CrossFire PDF exports.'); },
};
export default { Canvg };
