import re

with open('src/lib/quantum/sparse/sparseState.ts', 'r') as f:
    code = f.read()

# Replace Map and Set types
code = code.replace('Map<number, Complex>', 'Map<bigint, Complex>')
code = code.replace('Set<number>', 'Set<bigint>')

# initializeSparseFromBasis
code = code.replace('basisIndex: number,', 'basisIndex: bigint,')

# pruneSparseState
code = code.replace('pruneSparseState = (\n  state: SparseStateVector\n): SparseStateVector => {', 'pruneSparseState = (\n  state: SparseStateVector\n): SparseStateVector => {')

# bit masks
code = re.sub(r'const mask = 1 << bitPos;', 'const mask = 1n << BigInt(bitPos);', code)
code = re.sub(r'const mask1 = 1 << bit1Pos;', 'const mask1 = 1n << BigInt(bit1Pos);', code)
code = re.sub(r'const mask2 = 1 << bit2Pos;', 'const mask2 = 1n << BigInt(bit2Pos);', code)
code = re.sub(r'idx \^ mask;', 'idx ^ mask;', code) # works with bigint
code = re.sub(r'idx \^ \(1 << targetPos\)', 'idx ^ (1n << BigInt(targetPos))', code)

# bit shifts
code = re.sub(r'\(idx >> bitPos\) & 1;', 'Number((idx >> BigInt(bitPos)) & 1n);', code)
code = re.sub(r'\(idx >> controlPos\) & 1;', 'Number((idx >> BigInt(controlPos)) & 1n);', code)
code = re.sub(r'\(idx >> c1Pos\) & 1;', 'Number((idx >> BigInt(c1Pos)) & 1n);', code)
code = re.sub(r'\(idx >> c2Pos\) & 1;', 'Number((idx >> BigInt(c2Pos)) & 1n);', code)
code = re.sub(r'\(idx >> bit1Pos\) & 1;', 'Number((idx >> BigInt(bit1Pos)) & 1n);', code)
code = re.sub(r'\(idx >> bit2Pos\) & 1;', 'Number((idx >> BigInt(bit2Pos)) & 1n);', code)
code = re.sub(r'idx \^ mask1 \^ mask2', 'idx ^ mask1 ^ mask2', code)

# Initialization functions
code = code.replace('amplitudes.set(0,', 'amplitudes.set(0n,')
code = code.replace('export const formatBasisStateLabel = (\n  index: number,\n  qubitCount: number\n): string =>', 'export const formatBasisStateLabel = (\n  index: bigint,\n  qubitCount: number\n): string =>')
# Wait, formatBasisStateLabel is in bitOrder.ts! Not in sparseState.ts! So this doesn't matter here.

with open('src/lib/quantum/sparse/sparseState.ts', 'w') as f:
    f.write(code)

print("Done")
