export type BitOrder = 'MSB' | 'LSB';

export const reverseBitString = (bits: string): string => bits.split('').reverse().join('');

/**
 * Map a logical qubit label q_i to the underlying state-vector bit position.
 * - MSB: q0 is the leftmost / most-significant bit.
 * - LSB: q0 is the rightmost / least-significant bit.
 */
export const getBitPosition = (
  qubitCount: number,
  logicalQubit: number,
  bitOrder: BitOrder = 'MSB'
): number => (bitOrder === 'MSB' ? qubitCount - 1 - logicalQubit : logicalQubit);

/**
 * Map a logical qubit label q_i to the internal tensor index used by MPS.
 * Tensor index 0 corresponds to the leftmost wire in the tensor chain.
 */
export const getTensorIndex = (
  qubitCount: number,
  logicalQubit: number,
  bitOrder: BitOrder = 'MSB'
): number => (bitOrder === 'MSB' ? logicalQubit : qubitCount - 1 - logicalQubit);

export const formatBasisBits = (index: number | bigint, qubitCount: number): string =>
  index.toString(2).padStart(qubitCount, '0');

export const formatBasisStateLabel = (
  index: number | bigint,
  qubitCount: number
): string => `|${formatBasisBits(index, qubitCount)}⟩`;



/**
 * Convert an externally sourced bit string into the currently selected UI order.
 * Useful for provider-native hardware results where the source order is known.
 */
export const convertBitStringOrder = (
  bits: string,
  sourceOrder: BitOrder,
  targetOrder: BitOrder
): string => (sourceOrder === targetOrder ? bits : reverseBitString(bits));
