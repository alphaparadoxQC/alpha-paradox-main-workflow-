const fs = require('fs');
const nTurns = 3;
const inRad = 40;
const w = 1;
const gap = 4;
const pitch = w + gap;

const pts = [];
let step = 0;
for (step = 0; step < nTurns; step++) {
   const point_value = inRad / 2 + step * pitch;
   pts.push([-point_value, -point_value]);
   pts.push([point_value, -point_value]);
   pts.push([point_value, point_value]);
   pts.push([-point_value - pitch, point_value]);
}
const final_point_value = inRad / 2 + step * pitch;
pts.push([-final_point_value, -final_point_value]);

const polyline = pts.map(p => `${p[0]},${-p[1]}`).join(' '); // invert Y for SVG

const svg = `
<svg width="200" height="200" viewBox="-50 -50 100 100" xmlns="http://www.w3.org/2000/svg">
  <polyline points="${polyline}" fill="none" stroke="blue" stroke-width="1" />
</svg>
`;
fs.writeFileSync('spiral.svg', svg);
console.log("SVG generated");
