/**
 * Unit name to dimension mapping
 * 
 * Includes base units, derived units, and common SI-prefixed forms
 */

import type { Dimension } from './dimension';
import {
  LENGTH, MASS, TIME, CURRENT, TEMPERATURE, AMOUNT, LUMINOUS_INTENSITY,
  DIMENSIONLESS,
  mul, div, pow
} from './dimension';

/**
 * SI prefixes
 */
const prefixes: Record<string, number> = {
  'p': 1e-12,  // pico
  'n': 1e-9,   // nano
  'u': 1e-6,   // micro (μ)
  'm': 1e-3,   // milli
  'k': 1e3,    // kilo
  'M': 1e6,    // mega
};

/**
 * Base SI units
 */
const baseUnits: Record<string, Dimension> = {
  // Length
  'm': LENGTH,
  'meter': LENGTH,
  'metre': LENGTH,
  
  // Mass
  'kg': MASS,
  'kilogram': MASS,
  
  // Time
  's': TIME,
  'second': TIME,
  
  // Current
  'A': CURRENT,
  'ampere': CURRENT,
  'amp': CURRENT,
  
  // Temperature
  'K': TEMPERATURE,
  'kelvin': TEMPERATURE,
  
  // Amount
  'mol': AMOUNT,
  'mole': AMOUNT,
  
  // Luminous intensity
  'cd': LUMINOUS_INTENSITY,
  'candela': LUMINOUS_INTENSITY,
};

/**
 * Derived units
 */
const derivedUnits: Record<string, Dimension> = {
  // Frequency
  'Hz': div(DIMENSIONLESS, TIME),  // s^-1
  'hertz': div(DIMENSIONLESS, TIME),
  
  // Force
  'N': mul(mul(MASS, LENGTH), pow(TIME, -2)),  // kg⋅m⋅s^-2
  'newton': mul(mul(MASS, LENGTH), pow(TIME, -2)),
  
  // Pressure
  'Pa': mul(MASS, mul(pow(LENGTH, -1), pow(TIME, -2))),  // kg⋅m^-1⋅s^-2
  'pascal': mul(MASS, mul(pow(LENGTH, -1), pow(TIME, -2))),
  
  // Energy
  'J': mul(mul(MASS, pow(LENGTH, 2)), pow(TIME, -2)),  // kg⋅m^2⋅s^-2
  'joule': mul(mul(MASS, pow(LENGTH, 2)), pow(TIME, -2)),
  
  // Power
  'W': mul(mul(MASS, pow(LENGTH, 2)), pow(TIME, -3)),  // kg⋅m^2⋅s^-3
  'watt': mul(mul(MASS, pow(LENGTH, 2)), pow(TIME, -3)),
  
  // Charge
  'C': mul(TIME, CURRENT),  // s⋅A
  'coulomb': mul(TIME, CURRENT),
  
  // Voltage
  'V': mul(mul(mul(MASS, pow(LENGTH, 2)), pow(TIME, -3)), pow(CURRENT, -1)),  // kg⋅m^2⋅s^-3⋅A^-1
  'volt': mul(mul(mul(MASS, pow(LENGTH, 2)), pow(TIME, -3)), pow(CURRENT, -1)),
  
  // Resistance
  'ohm': mul(mul(mul(MASS, pow(LENGTH, 2)), pow(TIME, -3)), pow(CURRENT, -2)),  // kg⋅m^2⋅s^-3⋅A^-2
  'Ω': mul(mul(mul(MASS, pow(LENGTH, 2)), pow(TIME, -3)), pow(CURRENT, -2)),
  
  // Conductance
  'S': mul(mul(mul(pow(MASS, -1), pow(LENGTH, -2)), pow(TIME, 3)), pow(CURRENT, 2)),  // kg^-1⋅m^-2⋅s^3⋅A^2
  'siemens': mul(mul(mul(pow(MASS, -1), pow(LENGTH, -2)), pow(TIME, 3)), pow(CURRENT, 2)),
  
  // Capacitance
  'F': mul(mul(mul(pow(MASS, -1), pow(LENGTH, -2)), pow(TIME, 4)), pow(CURRENT, 2)),  // kg^-1⋅m^-2⋅s^4⋅A^2
  'farad': mul(mul(mul(pow(MASS, -1), pow(LENGTH, -2)), pow(TIME, 4)), pow(CURRENT, 2)),
  
  // Dimensionless
  '1': DIMENSIONLESS,
};

/**
 * Build prefixed units
 */
function buildPrefixedUnits(): Record<string, Dimension> {
  const prefixed: Record<string, Dimension> = {};
  
  // Units that accept prefixes
  const prefixable = [
    // Base units
    'm', 's', 'A', 'V', 'F', 'Hz', 'ohm',
  ];
  
  for (const unit of prefixable) {
    const baseDim = baseUnits[unit] ?? derivedUnits[unit];
    if (!baseDim) continue;
    
    for (const [prefix] of Object.entries(prefixes)) {
      prefixed[prefix + unit] = baseDim;
    }
  }
  
  return prefixed;
}

/**
 * Complete unit table
 */
export const unitTable: Record<string, Dimension> = {
  ...baseUnits,
  ...derivedUnits,
  ...buildPrefixedUnits(),
};

/**
 * Look up dimension for a unit name
 * Returns null if not found
 */
export function lookupUnit(name: string): Dimension | null {
  return unitTable[name] ?? null;
}

/**
 * Check if a name is a reserved unit name
 */
export function isReservedUnit(name: string): boolean {
  return name in unitTable;
}

/**
 * Get all reserved unit names (for error messages)
 */
export function getReservedNames(): string[] {
  return Object.keys(unitTable);
}
