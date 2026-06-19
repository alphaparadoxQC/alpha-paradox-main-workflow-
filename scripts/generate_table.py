import json

# Correct valence values for common elements
VALENCE = {
    'H': 1, 'He': 0,
    'Li': 1, 'Be': 2, 'B': 3, 'C': 4, 'N': 3, 'O': 2, 'F': 1, 'Ne': 0,
    'Na': 1, 'Mg': 2, 'Al': 3, 'Si': 4, 'P': 3, 'S': 2, 'Cl': 1, 'Ar': 0,
    'K': 1, 'Ca': 2,
    'Sc': 3, 'Ti': 4, 'V': 5, 'Cr': 3, 'Mn': 2, 'Fe': 2, 'Co': 2, 'Ni': 2, 'Cu': 1, 'Zn': 2,
    'Ga': 3, 'Ge': 4, 'As': 3, 'Se': 2, 'Br': 1, 'Kr': 0,
    'Rb': 1, 'Sr': 2,
    'Y': 3, 'Zr': 4, 'Nb': 5, 'Mo': 6, 'Tc': 4, 'Ru': 3, 'Rh': 3, 'Pd': 2, 'Ag': 1, 'Cd': 2,
    'In': 3, 'Sn': 4, 'Sb': 3, 'Te': 2, 'I': 1, 'Xe': 0,
    'Cs': 1, 'Ba': 2,
    'La': 3, 'Ce': 3, 'Pr': 3, 'Nd': 3, 'Pm': 3, 'Sm': 3, 'Eu': 3, 'Gd': 3,
    'Tb': 3, 'Dy': 3, 'Ho': 3, 'Er': 3, 'Tm': 3, 'Yb': 3, 'Lu': 3,
    'Hf': 4, 'Ta': 5, 'W': 6, 'Re': 4, 'Os': 4, 'Ir': 4, 'Pt': 2, 'Au': 1, 'Hg': 2,
    'Tl': 3, 'Pb': 4, 'Bi': 3, 'Po': 2, 'At': 1, 'Rn': 0,
    'Fr': 1, 'Ra': 2,
    'Ac': 3, 'Th': 4, 'Pa': 4, 'U': 6, 'Np': 5, 'Pu': 4, 'Am': 3, 'Cm': 3,
    'Bk': 3, 'Cf': 3, 'Es': 3, 'Fm': 3, 'Md': 3, 'No': 2, 'Lr': 3,
    'Rf': 4, 'Db': 5, 'Sg': 6, 'Bh': 4, 'Hs': 4, 'Mt': 4, 'Ds': 4, 'Rg': 3, 'Cn': 2,
    'Nh': 3, 'Fl': 4, 'Mc': 3, 'Lv': 2, 'Ts': 1, 'Og': 0,
}

# Correct covalent radii in Angstroms
COVALENT_RADIUS = {
    'H': 0.31, 'He': 0.28,
    'Li': 1.28, 'Be': 0.96, 'B': 0.84, 'C': 0.76, 'N': 0.71, 'O': 0.66, 'F': 0.57, 'Ne': 0.58,
    'Na': 1.66, 'Mg': 1.41, 'Al': 1.21, 'Si': 1.11, 'P': 1.07, 'S': 1.05, 'Cl': 1.02, 'Ar': 1.06,
    'K': 2.03, 'Ca': 1.76, 'Fe': 1.32, 'Cu': 1.32, 'Zn': 1.22, 'Br': 1.20, 'Kr': 1.16,
    'I': 1.39, 'Xe': 1.40,
}

colors = {
    'H': '#FFFFFF', 'He': '#D9FFFF', 'Li': '#CC80FF', 'Be': '#C2FF00', 'B': '#FFB5B5',
    'C': '#909090', 'N': '#3050F8', 'O': '#FF0D0D', 'F': '#90E050', 'Ne': '#B3E3F5',
    'Na': '#AB5CF2', 'Mg': '#8AFF00', 'Al': '#BFA6A6', 'Si': '#F0C8A0', 'P': '#FF8000',
    'S': '#FFFF30', 'Cl': '#1FF01F', 'Ar': '#80D1E3', 'K': '#8F40D4', 'Ca': '#3DFF00',
    'Fe': '#E06633', 'Cu': '#C88033', 'Zn': '#7D80B0', 'Br': '#A62929', 'Kr': '#5CB8D1',
    'I': '#940094', 'Xe': '#429EB0'
}

data = json.load(open('elements.json'))

def map_category(cat):
    cat = cat.lower()
    if 'alkali metal' in cat: return 'alkali-metal'
    if 'alkaline earth' in cat: return 'alkaline-earth'
    if 'transition metal' in cat: return 'transition-metal'
    if 'post-transition' in cat: return 'post-transition'
    if 'metalloid' in cat: return 'metalloid'
    if 'noble gas' in cat: return 'noble-gas'
    if 'halogen' in cat: return 'halogen'
    if 'lanthanide' in cat: return 'lanthanide'
    if 'actinide' in cat: return 'actinide'
    if 'nonmetal' in cat: return 'nonmetal'
    return 'transition-metal'

out = """// Periodic table data for the interactive atom picker.
// Includes group/period coordinates so we can lay it out as a real periodic table grid.

export interface ElementData {
  symbol: string;
  name: string;
  number: number;
  mass: number;
  group: number;   // 1-18
  period: number;  // 1-7
  category: string;
  electronegativity: number | null;
  valence: number;        // typical valence electrons used for bonding
  covalentRadius: number; // Å
  color: string;          // CPK-ish hex color
}

export const ELEMENTS: ElementData[] = [
"""

for el in data:
    if el['number'] > 118:
        continue
    sym = el['symbol']
    name = el['name'].replace("'", "")
    num = el['number']
    mass = el['atomic_mass']
    group = el.get('xpos', 1)
    period = el.get('ypos', 1)
    cat = map_category(el.get('category', ''))
    en = el.get('electronegativity_pauling')
    if en is None:
        en_str = 'null'
    else:
        en_str = str(en)
    val = VALENCE.get(sym, 2)
    rad = COVALENT_RADIUS.get(sym)
    if rad is None:
        # Approximate from atomic_radius if available
        ar = el.get('atomic_radius')
        if ar:
            rad = ar / 100.0
        else:
            rad = 1.5
    color = colors.get(sym, '#AAAAAA')
    
    out += f"  {{ symbol: '{sym}', name: '{name}', number: {num}, mass: {mass}, group: {group}, period: {period}, category: '{cat}', electronegativity: {en_str}, valence: {val}, covalentRadius: {rad}, color: '{color}' }},\n"

out += """];

export const CATEGORY_COLORS: Record<string, string> = {
  'alkali-metal':     'hsl(var(--chart-1))',
  'alkaline-earth':   'hsl(var(--chart-2))',
  'transition-metal': 'hsl(var(--chart-3))',
  'post-transition':  'hsl(var(--chart-4))',
  'metalloid':        'hsl(var(--chart-5))',
  'nonmetal':         'hsl(var(--primary))',
  'halogen':          'hsl(var(--accent))',
  'noble-gas':        'hsl(var(--muted-foreground))',
  'lanthanide':       'hsl(var(--chart-1))',
  'actinide':         'hsl(var(--chart-2))',
};

export function getElementBySymbol(symbol: string): ElementData | undefined {
  return ELEMENTS.find(e => e.symbol === symbol);
}
"""

with open('src/lib/chemistry/periodicTable.ts', 'w') as f:
    f.write(out)

print("Done! Generated periodicTable.ts with correct valences and covalent radii.")
