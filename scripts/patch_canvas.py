import re

file_path = "src/components/quantum/QuantumCanvas.tsx"
with open(file_path, "r") as f:
    content = f.read()

# Add displayData extraction before returning GateContextMenu
extraction = """
          const isSelected = selectedGateId === gate.id;
          const isDragging = draggingGateId === gate.id;
          
          const displayData = simulationResult?.displays?.[gate.id] || { x: 0, y: 0, z: 1 };
          const prob = (1 - displayData.z) / 2;
          const phaseAngle = Math.atan2(displayData.y, displayData.x);
          const r = GATE_WIDTH / 2 - 4;
"""

content = re.sub(r'\s*const isSelected = selectedGateId === gate\.id;\s*const isDragging = draggingGateId === gate\.id;',
                 extraction,
                 content)

# Replace the GATE BOX and text drawing with conditional rendering
standard_render = """
              {gate.type === 'DISPLAY' ? (
                <g>
                  {/* Phase Disk Background */}
                  <circle
                    cx={x}
                    cy={y}
                    r={GATE_WIDTH / 2}
                    fill="hsl(var(--card))"
                    stroke={gateInfo.color}
                    strokeWidth={isSelected ? 3 : 2}
                  />
                  {/* Clip Path for the water level */}
                  <clipPath id={`clip-${gate.id}`}>
                    <circle cx={x} cy={y} r={r} />
                  </clipPath>
                  {/* Water level representing probability */}
                  <rect
                    x={x - r}
                    y={y + r - prob * 2 * r}
                    width={2 * r}
                    height={prob * 2 * r}
                    fill={gateInfo.color}
                    clipPath={`url(#clip-${gate.id})`}
                    opacity={0.8}
                  />
                  {/* Outline */}
                  <circle
                    cx={x}
                    cy={y}
                    r={r}
                    fill="none"
                    stroke="hsl(var(--foreground))"
                    strokeWidth="1.5"
                    opacity="0.5"
                  />
                  {/* Phase indicator line (only if probability is non-negligible) */}
                  {prob > 0.001 && (
                    <line
                      x1={x}
                      y1={y}
                      x2={x + r * Math.cos(phaseAngle)}
                      y2={y - r * Math.sin(phaseAngle)}
                      stroke="hsl(var(--background))"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  )}
                </g>
              ) : (
                <g>
                  <rect
                    x={x - GATE_WIDTH / 2}
                    y={y - GATE_WIDTH / 2}
                    width={GATE_WIDTH}
                    height={GATE_WIDTH}
                    rx="6"
                    fill="hsl(var(--card))"
                    stroke={gateInfo.color}
                    strokeWidth={isSelected ? 3 : 2}
                    className="hover:stroke-[3]"
                    style={{ transition: 'stroke-width 0.2s' }}
                  />
                  
                  <text
                    x={x}
                    y={y + 6}
                    fill={gateInfo.color}
                    fontSize="18"
                    fontFamily="monospace"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {gateInfo.symbol}
                  </text>
                </g>
              )}
"""

# We need to find the <rect ... rx="6" ... /> up to the </text> tag for gateInfo.symbol
# and replace it with the standard_render above.
import re
pattern = re.compile(r'<rect\s+x=\{x - GATE_WIDTH / 2\}\s+y=\{y - GATE_WIDTH / 2\}(.*?)</text>', re.DOTALL)
content = pattern.sub(standard_render.strip(), content)

with open(file_path, "w") as f:
    f.write(content)
