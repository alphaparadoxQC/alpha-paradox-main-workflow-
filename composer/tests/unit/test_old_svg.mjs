import fs from 'fs';
const nTurns = 3;
const inRad = 40;
const w = 1;
const gap = 4;
const pitch = w + gap;

const pts = [];
let cx = -inRad;
let cy = -inRad;
pts.push([cx, cy]);

for (let t = 0; t < nTurns; t++) {
   cx = inRad + t * pitch;
   pts.push([cx, cy]);
   cy = inRad + t * pitch;
   pts.push([cx, cy]);
   cx = -inRad - t * pitch;
   pts.push([cx, cy]);
   cy = -inRad - (t + 1) * pitch;
   pts.push([cx, cy]);
}

const polyline = pts.map(p => `${p[0]},${-p[1]}`).join(' ');

const svg = `
<svg width="400" height="400" viewBox="-60 -60 120 120" xmlns="http://www.w3.org/2000/svg">
  <polyline points="${polyline}" fill="none" stroke="red" stroke-width="1" />
</svg>
`;
fs.writeFileSync('spiral_old.svg', svg);
console.log("Old SVG generated");
