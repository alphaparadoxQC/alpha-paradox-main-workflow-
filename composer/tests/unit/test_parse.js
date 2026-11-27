const parseValue = (val) => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  let s = val.toString().replace(/um/g, '').replace(/nm/g, 'e-3').replace(/mm/g, 'e3').trim();
  try { return new Function('return ' + s)(); } catch (e) { return 0; }
};
const w = parseValue('1um');
const gap = parseValue('4um');
console.log(typeof w, w);
console.log(typeof gap, gap);
console.log(w + gap);
