import re

file_path = "/Users/sourojitmondal/Desktop/quantum-workload-manager/src/components/quantum/GateContextMenu.tsx"
with open(file_path, "r") as f:
    content = f.read()

# Add Info to lucide-react imports
content = re.sub(r'import\s+\{\s*Trash2,\s*Copy,\s*Settings\s*\}\s*from\s*\'lucide-react\';',
                 "import { Trash2, Copy, Settings, Info } from 'lucide-react';",
                 content)

# Add showInfo state
content = re.sub(r'const\s+\[showProperties,\s*setShowProperties\]\s*=\s*useState\(false\);',
                 "const [showProperties, setShowProperties] = useState(false);\n   const [showInfo, setShowInfo] = useState(false);",
                 content)

# Add Info ContextMenuItem
info_menu_item = """           <ContextMenuItem onClick={() => setShowInfo(true)}>
             <Info className="w-4 h-4 mr-2" />
             Info
           </ContextMenuItem>

           {/* ============================================================
               DUPLICATE OPTION"""

content = re.sub(r'\{\/\*\s*============================================================\s*DUPLICATE OPTION',
                 info_menu_item,
                 content)

# Add Info Dialog
info_dialog = """            )}
          </DialogContent>
        </Dialog>
        
        {/* ============================================================
            INFO DIALOG
            ============================================================
            Modal dialog for displaying educational information about the gate.
            ============================================================ */}
        <Dialog open={showInfo} onOpenChange={setShowInfo}>
          <DialogContent className="sm:max-w-[400px]">
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
                {isRotationGate ? ' It is a parametric rotation gate whose angle can be dynamically changed.' : ' It is a fixed quantum operation.'}</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  };"""

content = re.sub(r'\s*\}\)\}\s*<\/DialogContent>\s*<\/Dialog>\s*<\/>\s*\);\s*\};\s*$',
                 "\n" + info_dialog + "\n",
                 content)

with open(file_path, "w") as f:
    f.write(content)

