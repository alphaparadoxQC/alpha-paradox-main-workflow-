import re

file_path = "/Users/sourojitmondal/Desktop/quantum-workload-manager/src/lib/quantum/tensor/mps.ts"
with open(file_path, "r") as f:
    content = f.read()

# Fix mpsToStateVector limit
content = re.sub(r'if\s*\(\s*qubitCount\s*>\s*25\s*\)',
                 "if (qubitCount > 15)",
                 content)

# Fix mpsProbabilities limit
content = re.sub(r'if\s*\(\s*qubitCount\s*<=\s*25\s*\)',
                 "if (qubitCount <= 15)",
                 content)

# Fix simulateCircuitMPS limit
content = re.sub(r'const\s+amplitudes\s*=\s*qubitCount\s*<=\s*20\s*\?\s*mpsToStateVector\s*\(\s*mps\s*\)\s*:\s*\[\s*\]\s*;',
                 "const amplitudes = qubitCount <= 15 ? mpsToStateVector(mps) : [];",
                 content)

with open(file_path, "w") as f:
    f.write(content)

