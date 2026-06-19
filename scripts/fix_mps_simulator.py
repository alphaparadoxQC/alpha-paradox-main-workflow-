import re

file_path = "src/lib/quantum/tensor/mps.ts"
with open(file_path, "r") as f:
    content = f.read()

# Add displays object to simulateCircuitMPS
content = re.sub(r'let mps = initializeMPS\(qubitCount\);',
                 "let mps = initializeMPS(qubitCount);\n  const displays: Record<string, { x: number; y: number; z: number }> = {};",
                 content)

# Add DISPLAY case to switch
display_case = """      case 'DISPLAY':
        displays[gate.id] = mpsBlochVector(mps, gate.qubit);
        break;
"""
content = re.sub(r'(case \'M\':)',
                 display_case + r"\n      \1",
                 content)

# Update return type of simulateCircuitMPS
content = re.sub(r'probabilities: \{ state: string; probability: number \}\[\] \}\s*=>\s*\{',
                 "probabilities: { state: string; probability: number }[]; displays: Record<string, { x: number; y: number; z: number }> } => {",
                 content)

# Return displays
content = re.sub(r'probabilities,\n  \};',
                 "probabilities,\n    displays,\n  };",
                 content)

with open(file_path, "w") as f:
    f.write(content)
