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
export const add = (a: Complex, b: Complex): Complex => {
  const sa = a || ZERO;
  const sb = b || ZERO;
  return {
    re: sa.re + sb.re,
    im: sa.im + sb.im
  };
};

export const subtract = (a: Complex, b: Complex): Complex => {
  const sa = a || ZERO;
  const sb = b || ZERO;
  return {
    re: sa.re - sb.re,
    im: sa.im - sb.im
  };
};

export const multiply = (a: Complex, b: Complex): Complex => {
  const sa = a || ZERO;
  const sb = b || ZERO;
  return {
    re: sa.re * sb.re - sa.im * sb.im,
    im: sa.re * sb.im + sa.im * sb.re
  };
};

export const divide = (a: Complex, b: Complex): Complex => {
  const sa = a || ZERO;
  const sb = b || ZERO;
  const denominator = sb.re * sb.re + sb.im * sb.im;
  if (denominator === 0) return ZERO;
  return {
    re: (sa.re * sb.re + sa.im * sb.im) / denominator,
    im: (sa.im * sb.re - sa.re * sb.im) / denominator
  };
};

// Scalar multiplication
export const scale = (c: Complex, scalar: number): Complex => {
  const sc = c || ZERO;
  return {
    re: sc.re * scalar,
    im: sc.im * scalar
  };
};

// Conjugate: a + bi -> a - bi
export const conjugate = (c: Complex): Complex => {
  const sc = c || ZERO;
  return {
    re: sc.re,
    im: -sc.im
  };
};

// Magnitude (absolute value): |a + bi| = sqrt(a² + b²)
export const magnitude = (c: Complex): number => {
  const sc = c || ZERO;
  return Math.sqrt(sc.re * sc.re + sc.im * sc.im);
};

// Magnitude squared (probability): |a + bi|² = a² + b²
export const magnitudeSquared = (c: Complex): number => {
  const sc = c || ZERO;
  return sc.re * sc.re + sc.im * sc.im;
};

// Phase angle: arg(a + bi) = atan2(b, a)
export const phase = (c: Complex): number => {
  const sc = c || ZERO;
  return Math.atan2(sc.im, sc.re);
};

// Exponential: e^(ix) = cos(x) + i*sin(x)
export const expI = (theta: number): Complex => ({
  re: Math.cos(theta),
  im: Math.sin(theta)
});

// Check if approximately equal
export const equals = (a: Complex, b: Complex, epsilon = 1e-10): boolean => {
  const sa = a || ZERO;
  const sb = b || ZERO;
  return Math.abs(sa.re - sb.re) < epsilon && Math.abs(sa.im - sb.im) < epsilon;
};

// String representation
export const toString = (c: Complex, precision = 4): string => {
  const sc = c || ZERO;
  const re = sc.re.toFixed(precision);
  const im = Math.abs(sc.im).toFixed(precision);
  
  if (Math.abs(sc.im) < 1e-10) return re;
  if (Math.abs(sc.re) < 1e-10) return sc.im >= 0 ? `${im}i` : `-${im}i`;
  
  return sc.im >= 0 ? `${re}+${im}i` : `${re}-${im}i`;
};

