import re

file_path = "src/lib/quantum/simulator.ts"
with open(file_path, "r") as f:
    content = f.read()

# Add displays object to simulateCircuit
content = re.sub(r'let state = initializeState\(qubitCount\);',
                 "let state = initializeState(qubitCount);\n  const displays: Record<string, { x: number; y: number; z: number }> = {};",
                 content)

# Add DISPLAY case to switch
display_case = """      case 'DISPLAY':
        displays[gate.id] = extractQubitStates(state, bitOrder)[gate.qubit];
        break;
"""
content = re.sub(r'(case \'M\':)',
                 display_case + r"\n      \1",
                 content)

# Return displays
content = re.sub(r'hasMeasurement\n  };',
                 "hasMeasurement,\n    displays\n  };",
                 content)

with open(file_path, "w") as f:
    f.write(content)
