/**
 * Mirrors Alpha Paradox's ParsedDynamicAttributes_Component
 * Handles the dynamic parsing of options and attributes, executing AST-like
 * evaluation on string values with units or variable references.
 */

export class ParsedDynamicAttributes {
  constructor(options, variables) {
    this.options = options;
    this.variables = variables;
    
    // Proxy intercepts dictionary access (e.g., dict['key'])
    return new Proxy(this, {
      get: (target, prop) => {
        if (prop in target) {
          return target[prop];
        }
        if (prop in target.options) {
          return target.parseValue(target.options[prop]);
        }
        return undefined;
      }
    });
  }

  // Evaluates equations and replaces units (Base unit: micrometers um)
  parseValue(val) {
    if (typeof val === 'number') return val;
    if (typeof val !== 'string') {
      // Support nested dictionaries recursively!
      if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
        return new ParsedDynamicAttributes(val, this.variables);
      }
      return val;
    }

    let str = val.trim();

    // Expand known variables
    for (const [vName, vVal] of Object.entries(this.variables || {})) {
      if (str.includes(vName)) {
        str = str.replace(new RegExp(vName, 'g'), String(vVal));
      }
    }

    // Units sorted by length descending so 'mm', 'um', 'nm', 'cm' match before 'm'
    // Canvas base unit is micrometers (um): 1 um = 1, 1 mm = 1000 um, 1 cm = 10000 um, 1 m = 1e6 um, 1 nm = 0.001 um
    const units = [
      ['mm', 1000],
      ['um', 1],
      ['nm', 0.001],
      ['cm', 10000],
      ['m', 1000000]
    ];

    for (const [u, mult] of units) {
      if (str.endsWith(u)) {
        const numPart = str.slice(0, -u.length).trim();
        if (!isNaN(numPart) && numPart !== '') {
          return parseFloat(numPart) * mult;
        }
      }
    }

    // Try evaluating mathematical expressions with units (e.g., '10um + 20um', '7mm / 2')
    try {
      let expr = str;
      for (const [u, mult] of units) {
        const regex = new RegExp(`([\\d.]+)\\s*${u}\\b`, 'g');
        expr = expr.replace(regex, `($1 * ${mult})`);
      }
      if (/^[\d.\-+*/\s()]+$/.test(expr)) {
        const res = Function(`'use strict'; return (${expr})`)();
        if (typeof res === 'number' && !isNaN(res)) return res;
      }
    } catch (e) {
      console.warn(`ParsedDynamicAttributes failed to parse: ${val}`);
    }

    const parsedNum = parseFloat(str);
    return isNaN(parsedNum) ? str : parsedNum;
  }

  // Length of attributes
  get length() {
    return Object.keys(this.options).length;
  }

  // Iterate over items
  entries() {
    return Object.entries(this.options).map(([k, v]) => [k, this.parseValue(v)]);
  }

  // Fallback for Alpha Paradox's `items()` method
  items() {
    return this.entries();
  }
}
