// Periodic table data for the interactive atom picker.
// Includes group/period coordinates so we can lay it out as a real periodic table grid.

export interface ElementData {
  symbol: string;
  name: string;
  number: number;
  mass: number;
  group: number;   // 1-18
  period: number;  // 1-7
  category:
    | 'alkali-metal'
    | 'alkaline-earth'
    | 'transition-metal'
    | 'post-transition'
    | 'metalloid'
    | 'nonmetal'
    | 'halogen'
    | 'noble-gas'
    | 'lanthanide'
    | 'actinide';
  electronegativity: number | null;
  valence: number;        // typical valence electrons used for bonding
  covalentRadius: number; // Å
  color: string;          // CPK-ish hex color
}

export const ELEMENTS: ElementData[] = [
  // Period 1
  { symbol: 'H',  name: 'Hydrogen',   number: 1,  mass: 1.008,  group: 1,  period: 1, category: 'nonmetal',         electronegativity: 2.20, valence: 1, covalentRadius: 0.31, color: '#FFFFFF' },
  { symbol: 'He', name: 'Helium',     number: 2,  mass: 4.0026, group: 18, period: 1, category: 'noble-gas',        electronegativity: null, valence: 0, covalentRadius: 0.28, color: '#D9FFFF' },

  // Period 2
  { symbol: 'Li', name: 'Lithium',    number: 3,  mass: 6.94,   group: 1,  period: 2, category: 'alkali-metal',     electronegativity: 0.98, valence: 1, covalentRadius: 1.28, color: '#CC80FF' },
  { symbol: 'Be', name: 'Beryllium',  number: 4,  mass: 9.0122, group: 2,  period: 2, category: 'alkaline-earth',   electronegativity: 1.57, valence: 2, covalentRadius: 0.96, color: '#C2FF00' },
  { symbol: 'B',  name: 'Boron',      number: 5,  mass: 10.81,  group: 13, period: 2, category: 'metalloid',        electronegativity: 2.04, valence: 3, covalentRadius: 0.84, color: '#FFB5B5' },
  { symbol: 'C',  name: 'Carbon',     number: 6,  mass: 12.011, group: 14, period: 2, category: 'nonmetal',         electronegativity: 2.55, valence: 4, covalentRadius: 0.76, color: '#909090' },
  { symbol: 'N',  name: 'Nitrogen',   number: 7,  mass: 14.007, group: 15, period: 2, category: 'nonmetal',         electronegativity: 3.04, valence: 3, covalentRadius: 0.71, color: '#3050F8' },
  { symbol: 'O',  name: 'Oxygen',     number: 8,  mass: 15.999, group: 16, period: 2, category: 'nonmetal',         electronegativity: 3.44, valence: 2, covalentRadius: 0.66, color: '#FF0D0D' },
  { symbol: 'F',  name: 'Fluorine',   number: 9,  mass: 18.998, group: 17, period: 2, category: 'halogen',          electronegativity: 3.98, valence: 1, covalentRadius: 0.57, color: '#90E050' },
  { symbol: 'Ne', name: 'Neon',       number: 10, mass: 20.180, group: 18, period: 2, category: 'noble-gas',        electronegativity: null, valence: 0, covalentRadius: 0.58, color: '#B3E3F5' },

  // Period 3
  { symbol: 'Na', name: 'Sodium',     number: 11, mass: 22.990, group: 1,  period: 3, category: 'alkali-metal',     electronegativity: 0.93, valence: 1, covalentRadius: 1.66, color: '#AB5CF2' },
  { symbol: 'Mg', name: 'Magnesium',  number: 12, mass: 24.305, group: 2,  period: 3, category: 'alkaline-earth',   electronegativity: 1.31, valence: 2, covalentRadius: 1.41, color: '#8AFF00' },
  { symbol: 'Al', name: 'Aluminium',  number: 13, mass: 26.982, group: 13, period: 3, category: 'post-transition',  electronegativity: 1.61, valence: 3, covalentRadius: 1.21, color: '#BFA6A6' },
  { symbol: 'Si', name: 'Silicon',    number: 14, mass: 28.085, group: 14, period: 3, category: 'metalloid',        electronegativity: 1.90, valence: 4, covalentRadius: 1.11, color: '#F0C8A0' },
  { symbol: 'P',  name: 'Phosphorus', number: 15, mass: 30.974, group: 15, period: 3, category: 'nonmetal',         electronegativity: 2.19, valence: 3, covalentRadius: 1.07, color: '#FF8000' },
  { symbol: 'S',  name: 'Sulfur',     number: 16, mass: 32.06,  group: 16, period: 3, category: 'nonmetal',         electronegativity: 2.58, valence: 2, covalentRadius: 1.05, color: '#FFFF30' },
  { symbol: 'Cl', name: 'Chlorine',   number: 17, mass: 35.45,  group: 17, period: 3, category: 'halogen',          electronegativity: 3.16, valence: 1, covalentRadius: 1.02, color: '#1FF01F' },
  { symbol: 'Ar', name: 'Argon',      number: 18, mass: 39.948, group: 18, period: 3, category: 'noble-gas',        electronegativity: null, valence: 0, covalentRadius: 1.06, color: '#80D1E3' },

  // Period 4 (selected — main group + most-used transition metals for chemistry simulations)
  { symbol: 'K',  name: 'Potassium',  number: 19, mass: 39.098, group: 1,  period: 4, category: 'alkali-metal',     electronegativity: 0.82, valence: 1, covalentRadius: 2.03, color: '#8F40D4' },
  { symbol: 'Ca', name: 'Calcium',    number: 20, mass: 40.078, group: 2,  period: 4, category: 'alkaline-earth',   electronegativity: 1.00, valence: 2, covalentRadius: 1.76, color: '#3DFF00' },
  { symbol: 'Fe', name: 'Iron',       number: 26, mass: 55.845, group: 8,  period: 4, category: 'transition-metal', electronegativity: 1.83, valence: 2, covalentRadius: 1.32, color: '#E06633' },
  { symbol: 'Cu', name: 'Copper',     number: 29, mass: 63.546, group: 11, period: 4, category: 'transition-metal', electronegativity: 1.90, valence: 1, covalentRadius: 1.32, color: '#C88033' },
  { symbol: 'Zn', name: 'Zinc',       number: 30, mass: 65.38,  group: 12, period: 4, category: 'transition-metal', electronegativity: 1.65, valence: 2, covalentRadius: 1.22, color: '#7D80B0' },
  { symbol: 'Br', name: 'Bromine',    number: 35, mass: 79.904, group: 17, period: 4, category: 'halogen',          electronegativity: 2.96, valence: 1, covalentRadius: 1.20, color: '#A62929' },
  { symbol: 'Kr', name: 'Krypton',    number: 36, mass: 83.798, group: 18, period: 4, category: 'noble-gas',        electronegativity: 3.00, valence: 0, covalentRadius: 1.16, color: '#5CB8D1' },

  // Period 5 (selected)
  { symbol: 'I',  name: 'Iodine',     number: 53, mass: 126.90, group: 17, period: 5, category: 'halogen',          electronegativity: 2.66, valence: 1, covalentRadius: 1.39, color: '#940094' },
  { symbol: 'Xe', name: 'Xenon',      number: 54, mass: 131.29, group: 18, period: 5, category: 'noble-gas',        electronegativity: 2.60, valence: 0, covalentRadius: 1.40, color: '#429EB0' },
];

export const CATEGORY_COLORS: Record<ElementData['category'], string> = {
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
