/**
 * Complex number implementation for quantum computing
 */

export interface Complex {
  re: number;  // Real part
  im: number;  // Imaginary part
}

// Create complex number
export const complex = (re: number, im: number = 0): Complex => ({ re, im });

// Complex zero and one
export const ZERO: Complex = { re: 0, im: 0 };
export const ONE: Complex = { re: 1, im: 0 };
export const I: Complex = { re: 0, im: 1 };  // Imaginary unit

// Basic operations
export const add = (a: Complex, b: Complex): Complex => ({
  re: a.re + b.re,
  im: a.im + b.im
});

export const subtract = (a: Complex, b: Complex): Complex => ({
  re: a.re - b.re,
  im: a.im - b.im
});

export const multiply = (a: Complex, b: Complex): Complex => ({
  re: a.re * b.re - a.im * b.im,
  im: a.re * b.im + a.im * b.re
});

export const divide = (a: Complex, b: Complex): Complex => {
  const denominator = b.re * b.re + b.im * b.im;
  return {
    re: (a.re * b.re + a.im * b.im) / denominator,
    im: (a.im * b.re - a.re * b.im) / denominator
  };
};

// Scalar multiplication
export const scale = (c: Complex, scalar: number): Complex => ({
  re: c.re * scalar,
  im: c.im * scalar
});

// Conjugate: a + bi -> a - bi
export const conjugate = (c: Complex): Complex => ({
  re: c.re,
  im: -c.im
});

// Magnitude (absolute value): |a + bi| = sqrt(a² + b²)
export const magnitude = (c: Complex): number => 
  Math.sqrt(c.re * c.re + c.im * c.im);

// Magnitude squared (probability): |a + bi|² = a² + b²
export const magnitudeSquared = (c: Complex): number => 
  c.re * c.re + c.im * c.im;

// Phase angle: arg(a + bi) = atan2(b, a)
export const phase = (c: Complex): number => 
  Math.atan2(c.im, c.re);

// Exponential: e^(ix) = cos(x) + i*sin(x)
export const expI = (theta: number): Complex => ({
  re: Math.cos(theta),
  im: Math.sin(theta)
});

// Check if approximately equal
export const equals = (a: Complex, b: Complex, epsilon = 1e-10): boolean =>
  Math.abs(a.re - b.re) < epsilon && Math.abs(a.im - b.im) < epsilon;

// String representation
export const toString = (c: Complex, precision = 4): string => {
  const re = c.re.toFixed(precision);
  const im = Math.abs(c.im).toFixed(precision);
  
  if (Math.abs(c.im) < 1e-10) return re;
  if (Math.abs(c.re) < 1e-10) return c.im >= 0 ? `${im}i` : `-${im}i`;
  
  return c.im >= 0 ? `${re}+${im}i` : `${re}-${im}i`;
};
