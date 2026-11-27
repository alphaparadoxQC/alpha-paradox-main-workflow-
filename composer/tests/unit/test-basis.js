import { Complex } from './src/quantum-engine/complex.js';

function transformMatrix(m, basis) {
  if (basis === '01') return m;
  
  const m00 = m[0][0], m01 = m[0][1], m10 = m[1][0], m11 = m[1][1];
  
  if (basis === '+-') {
    // H M H
    const t00 = m00.add(m01).add(m10).add(m11).mul(0.5);
    const t01 = m00.sub(m01).add(m10).sub(m11).mul(0.5);
    const t10 = m00.add(m01).sub(m10).sub(m11).mul(0.5);
    const t11 = m00.sub(m01).sub(m10).add(m11).mul(0.5);
    return [
      [t00, t01],
      [t10, t11]
    ];
  }
  
  if (basis === '+i') {
    // U^dagger M U where U = S H
    // U^dagger = 1/sqrt(2) [1, -i; 1, i]
    // U = 1/sqrt(2) [1, 1; i, -i]
    const i = Complex.i();
    const half = 0.5;
    
    // t00 = 0.5 * (m00 + m11 + i(m01 - m10))
    const t00 = m00.add(m11).add( i.mul(m01.sub(m10)) ).mul(half);
    // t01 = 0.5 * (m00 - m11 - i(m01 + m10))
    const t01 = m00.sub(m11).sub( i.mul(m01.add(m10)) ).mul(half);
    // t10 = 0.5 * (m00 - m11 + i(m01 + m10))
    const t10 = m00.sub(m11).add( i.mul(m01.add(m10)) ).mul(half);
    // t11 = 0.5 * (m00 + m11 - i(m01 - m10))
    const t11 = m00.add(m11).sub( i.mul(m01.sub(m10)) ).mul(half);
    
    return [
      [t00, t01],
      [t10, t11]
    ];
  }
  
  return m;
}

const X = [
  [new Complex(0,0), new Complex(1,0)],
  [new Complex(1,0), new Complex(0,0)]
];
console.log("X in +- basis (should be Z):", transformMatrix(X, '+-'));
console.log("X in +i basis (should be -Y):", transformMatrix(X, '+i'));
