import re

file_path = "src/lib/quantum/simulator.ts"
with open(file_path, "r") as f:
    content = f.read()

# Add displays object to simulateCircuitWithMPS
content = re.sub(r'const mpsResult = simulateCircuitMPS\(gates, qubitCount, config, bitOrder\);',
                 "const mpsResult = simulateCircuitMPS(gates, qubitCount, config, bitOrder);\n  const displays = mpsResult.displays;",
                 content)

# Return displays
content = re.sub(r'hasMeasurement,\n  };',
                 "hasMeasurement,\n    displays,\n  };",
                 content)

with open(file_path, "w") as f:
    f.write(content)
