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

console.log(JSON.stringify(pts));
