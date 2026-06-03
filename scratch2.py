import re

file_path = "/Users/sourojitmondal/Desktop/quantum-workload-manager/src/components/quantum/QuantumCanvas.tsx"
with open(file_path, "r") as f:
    content = f.read()

# Add imports for dialog and Info icon
content = re.sub(r'import\s+\{\s*X\s*\}\s*from\s*\'lucide-react\';',
                 "import { X, Info } from 'lucide-react';\nimport {\n  Dialog,\n  DialogContent,\n  DialogHeader,\n  DialogTitle,\n  DialogDescription,\n} from '@/components/ui/dialog';",
                 content)

# Add infoGateId state
content = re.sub(r'const\s+\[draggingGateId,\s*setDraggingGateId\]\s*=\s*useState<string\s*\|\s*null>\(null\);',
                 "const [draggingGateId, setDraggingGateId] = useState<string | null>(null);\n   const [infoGateId, setInfoGateId] = useState<string | null>(null);",
                 content)

# Add info button to gate
info_btn = """              <g
                className="cursor-pointer opacity-0 hover:opacity-100"
                style={{ transition: 'opacity 0.2s' }}
                 onClick={(e) => {
                   e.stopPropagation();
                   setInfoGateId(gate.id);
                 }}
              >
                <circle
                  cx={x - GATE_WIDTH / 2 + 5}
                  cy={y - GATE_WIDTH / 2 + 5}
                  r="8"
                  fill="hsl(210, 100%, 50%)"
                />
                <foreignObject
                  x={x - GATE_WIDTH / 2 - 1}
                  y={y - GATE_WIDTH / 2 - 1}
                  width="12"
                  height="12"
                >
                  <Info className="w-3 h-3 text-white" />
                </foreignObject>
              </g>

              <g
                className="cursor-pointer opacity-0 hover:opacity-100"
"""

content = re.sub(r'<\s*g\s*className="cursor-pointer opacity-0 hover:opacity-100"\s*style=\{\{\s*transition:\s*\'opacity\s*0\.2s\'\s*\}\}\s*onClick=\{\(e\)\s*=>\s*\{\s*e\.stopPropagation\(\);\s*removeGate\(gate\.id\);\s*\}\}\s*>',
                 info_btn,
                 content)

# Add Dialog rendering
dialog_render = """      {/* Info Dialog */}
      <Dialog open={!!infoGateId} onOpenChange={(open) => !open && setInfoGateId(null)}>
        <DialogContent className="sm:max-w-[400px]">
          {(() => {
            if (!infoGateId) return null;
            const gate = gates.find(g => g.id === infoGateId);
            if (!gate) return null;
            const gateInfo = GATE_INFO[gate.type as GateType] ?? EXTENDED_GATE_INFO[gate.type as keyof typeof EXTENDED_GATE_INFO] ?? { color: 'hsl(200, 80%, 60%)', symbol: gate.type, name: gate.type, description: '' };
            const isRotationGate = ['Rx', 'Ry', 'Rz', 'P', 'U1', 'CP'].includes(gate.type);
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <span 
                      className="flex items-center justify-center w-8 h-8 rounded text-lg font-bold" 
                      style={{ backgroundColor: `${gateInfo.color}20`, color: gateInfo.color, border: `1px solid ${gateInfo.color}50` }} 
                    >
                      {gateInfo.symbol}
                    </span>
                    {gateInfo.name}
                  </DialogTitle>
                  <DialogDescription className="pt-4 text-base text-foreground">
                    {gateInfo.description}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-2">
                  <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
                    <p className="mb-2"><strong className="text-foreground">Category:</strong> {('category' in gateInfo) ? (gateInfo as any).category : 'Standard'}</p>
                    <p><strong className="text-foreground">Mathematical Context:</strong> This gate applies a specific unitary transformation to the qubit state. 
                    {isRotationGate ? ' It is a parametric phase or rotation gate whose angle can be dynamically changed.' : ' It is a fixed quantum operation.'}</p>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};"""

content = re.sub(r'<\s*div\s*className="text-center"\s*>\s*<\s*div\s*className="text-6xl\s*mb-4\s*opacity-20"\s*>\s*⚛\s*<\s*/\s*div\s*>\s*<\s*p\s*className="text-muted-foreground\s*text-lg"\s*>\s*Drag\s*quantum\s*gates\s*from\s*the\s*left\s*panel\s*<\s*/\s*p\s*>\s*<\s*p\s*className="text-muted-foreground/60\s*text-sm\s*mt-2"\s*>\s*Drop\s*them\s*on\s*qubit\s*lines\s*to\s*build\s*your\s*circuit\s*<\s*/\s*p\s*>\s*<\s*/\s*div\s*>\s*<\s*/\s*motion\.div\s*>\s*\)\}\s*<\s*/\s*div\s*>\s*;\s*\}\s*;',
                 r'          <div className="text-center">\n            <div className="text-6xl mb-4 opacity-20">⚛</div>\n            <p className="text-muted-foreground text-lg">\n              Drag quantum gates from the left panel\n            </p>\n            <p className="text-muted-foreground/60 text-sm mt-2">\n              Drop them on qubit lines to build your circuit\n            </p>\n          </div>\n        </motion.div>\n      )}\n\n' + dialog_render,
                 content)

with open(file_path, "w") as f:
    f.write(content)

