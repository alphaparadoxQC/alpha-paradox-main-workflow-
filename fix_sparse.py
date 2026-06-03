import re

with open('src/lib/quantum/sparse/sparseState.ts', 'r') as f:
    code = f.read()

code = re.sub(r'const mask1 = 1 << bit1Pos;', 'const mask1 = 1n << BigInt(bit1Pos);', code)
code = re.sub(r'const mask2 = 1 << bit2Pos;', 'const mask2 = 1n << BigInt(bit2Pos);', code)
code = re.sub(r'\(idx >> BigInt\(bit1Pos\)\) & 1\b', '(idx >> BigInt(bit1Pos)) & 1n', code)
code = re.sub(r'\(idx >> BigInt\(bit2Pos\)\) & 1\b', '(idx >> BigInt(bit2Pos)) & 1n', code)
code = re.sub(r'\(idx >> BigInt\(targetPos\)\) & 1\b', '(idx >> BigInt(targetPos)) & 1n', code)
code = re.sub(r'\(idx >> BigInt\(bitPos\)\) & 1\b', '(idx >> BigInt(bitPos)) & 1n', code)
code = re.sub(r'idx \^ \(1 << tPos\)', 'idx ^ (1n << BigInt(tPos))', code)
code = re.sub(r'& 1\) === 0\b', '& 1n) === 0n', code)
code = re.sub(r'const mask = 1 << bitPos;', 'const mask = 1n << BigInt(bitPos);', code)

with open('src/lib/quantum/sparse/sparseState.ts', 'w') as f:
    f.write(code)

print("Done")
