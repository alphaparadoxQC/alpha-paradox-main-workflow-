import re

file_path = "/Users/sourojitmondal/Desktop/quantum-workload-manager/src/components/quantum/GatesPalette.tsx"
with open(file_path, "r") as f:
    content = f.read()

# Add PanelLeftClose, PanelLeftOpen icons
content = re.sub(r'import\s+\{\s*ChevronDown,\s*ChevronRight,\s*FlaskConical,\s*Atom,\s*Pill,\s*ExternalLink\s*\}\s*from\s*\'lucide-react\';',
                 "import { ChevronDown, ChevronRight, FlaskConical, Atom, Pill, ExternalLink, PanelLeftClose, PanelLeftOpen } from 'lucide-react';\nimport { Button } from '@/components/ui/button';",
                 content)

# Add isCollapsed state
content = re.sub(r'const\s+\[expandedCategories,\s*setExpandedCategories\]\s*=\s*useState<Set<GateCategory>>\(',
                 "const [isCollapsed, setIsCollapsed] = useState(false);\n  const [expandedCategories, setExpandedCategories] = useState<Set<GateCategory>>(",
                 content)

# Update root div and add toggle button
toggle_button = """    <motion.div 
      initial={false}
      animate={{ width: isCollapsed ? 48 : 288 }}
      className="bg-sidebar border-r border-sidebar-border flex flex-col h-full overflow-hidden relative shrink-0"
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 z-10 h-6 w-6 text-muted-foreground hover:text-foreground"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
      </Button>

      <div className={`flex flex-col h-full w-72 transition-opacity duration-200 ${isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>"""

content = re.sub(r'<\s*div\s*className="w-72\s*max-w-\[40vw\]\s*bg-sidebar\s*border-r\s*border-sidebar-border\s*flex\s*flex-col\s*h-full\s*overflow-hidden"\s*>',
                 toggle_button,
                 content)

content = re.sub(r'<\s*/\s*Tabs\s*>\s*<\s*/\s*div\s*>\s*;\s*\}\s*;',
                 r'      </Tabs>\n      </div>\n    </motion.div>\n  );\n};',
                 content)

with open(file_path, "w") as f:
    f.write(content)

