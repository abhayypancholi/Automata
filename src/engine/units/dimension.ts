/**
 * Physical dimension representation and arithmetic
 * 
 * A dimension is represented as integer exponents over the 7 SI base dimensions:
 * [Length, Mass, Time, Current, Temperature, Amount, Luminous Intensity]
 * 
 * Example: volt = kg⋅m²⋅s⁻³⋅A⁻¹ = [2, 1, -3, -1, 0, 0, 0]
 */

/**
 * Dimension: 7-tuple of integer exponents
 * [L, M, T, I, Θ, N, J]
 * where:
 * - L: length (meter)
 * - M: mass (kilogram)
 * - T: time (second)
 * - I: electric current (ampere)
 * - Θ: thermodynamic temperature (kelvin)
 * - N: amount of substance (mole)
 * - J: luminous intensity (candela)
 */
export type Dimension = readonly [
  number, // Length
  number, // Mass
  number, // Time
  number, // Current
  number, // Temperature
  number, // Amount
  number  // Luminous intensity
];

/**
 * Dimensionless (all exponents zero)
 */
export const DIMENSIONLESS: Dimension = [0, 0, 0, 0, 0, 0, 0];

/**
 * Base dimensions
 */
export const LENGTH: Dimension = [1, 0, 0, 0, 0, 0, 0];
export const MASS: Dimension = [0, 1, 0, 0, 0, 0, 0];
export const TIME: Dimension = [0, 0, 1, 0, 0, 0, 0];
export const CURRENT: Dimension = [0, 0, 0, 1, 0, 0, 0];
export const TEMPERATURE: Dimension = [0, 0, 0, 0, 1, 0, 0];
export const AMOUNT: Dimension = [0, 0, 0, 0, 0, 1, 0];
export const LUMINOUS_INTENSITY: Dimension = [0, 0, 0, 0, 0, 0, 1];

/**
 * Multiply dimensions: add exponents
 */
export function mul(a: Dimension, b: Dimension): Dimension {
  return [
    a[0] + b[0],
    a[1] + b[1],
    a[2] + b[2],
    a[3] + b[3],
    a[4] + b[4],
    a[5] + b[5],
    a[6] + b[6],
  ];
}

/**
 * Divide dimensions: subtract exponents
 */
export function div(a: Dimension, b: Dimension): Dimension {
  return [
    a[0] - b[0],
    a[1] - b[1],
    a[2] - b[2],
    a[3] - b[3],
    a[4] - b[4],
    a[5] - b[5],
    a[6] - b[6],
  ];
}

/**
 * Power: multiply all exponents by integer
 */
export function pow(dim: Dimension, exponent: number): Dimension {
  return [
    dim[0] * exponent,
    dim[1] * exponent,
    dim[2] * exponent,
    dim[3] * exponent,
    dim[4] * exponent,
    dim[5] * exponent,
    dim[6] * exponent,
  ];
}

/**
 * Check if two dimensions are equal
 */
export function equal(a: Dimension, b: Dimension): boolean {
  return (
    a[0] === b[0] &&
    a[1] === b[1] &&
    a[2] === b[2] &&
    a[3] === b[3] &&
    a[4] === b[4] &&
    a[5] === b[5] &&
    a[6] === b[6]
  );
}

/**
 * Check if dimension is dimensionless
 */
export function isDimensionless(dim: Dimension): boolean {
  return equal(dim, DIMENSIONLESS);
}

/**
 * Format dimension as base-unit product string
 * 
 * Example: [2, 1, -3, -1, 0, 0, 0] → "m^2 kg s^-3 A^-1"
 */
export function format(dim: Dimension): string {
  const symbols = ['m', 'kg', 's', 'A', 'K', 'mol', 'cd'];
  const parts: string[] = [];
  
  for (let i = 0; i < 7; i++) {
    const exp = dim[i];
    if (exp === 0) continue;
    
    if (exp === 1) {
      parts.push(symbols[i]!);
    } else {
      parts.push(`${symbols[i]}^${exp}`);
    }
  }
  
  if (parts.length === 0) {
    return '1'; // Dimensionless
  }
  
  return parts.join(' ');
}

/**
 * Try to find a named unit for this dimension
 * Returns the common name if found, null otherwise
 */
export function nameOf(dim: Dimension): string | null {
  // Import will be circular if we import from unitTable here
  // So we'll define the common derived units inline
  
  // Check common derived units
  const commonUnits: Array<[Dimension, string]> = [
    [[0, 0, -1, 0, 0, 0, 0], 'Hz'],     // hertz
    [[1, 1, -2, 0, 0, 0, 0], 'N'],      // newton
    [[-1, 1, -2, 0, 0, 0, 0], 'Pa'],    // pascal
    [[2, 1, -2, 0, 0, 0, 0], 'J'],      // joule
    [[2, 1, -3, 0, 0, 0, 0], 'W'],      // watt
    [[0, 0, 1, 1, 0, 0, 0], 'C'],       // coulomb
    [[2, 1, -3, -1, 0, 0, 0], 'V'],     // volt
    [[2, 1, -3, -2, 0, 0, 0], 'Ω'],     // ohm
    [[-2, -1, 3, 2, 0, 0, 0], 'S'],     // siemens
    [[-2, -1, 4, 2, 0, 0, 0], 'F'],     // farad
  ];
  
  for (const [unitDim, name] of commonUnits) {
    if (equal(dim, unitDim as Dimension)) {
      return name;
    }
  }
  
  // Check base units
  if (equal(dim, LENGTH)) return 'm';
  if (equal(dim, MASS)) return 'kg';
  if (equal(dim, TIME)) return 's';
  if (equal(dim, CURRENT)) return 'A';
  if (equal(dim, TEMPERATURE)) return 'K';
  if (equal(dim, AMOUNT)) return 'mol';
  if (equal(dim, LUMINOUS_INTENSITY)) return 'cd';
  
  if (isDimensionless(dim)) return '1';
  
  return null;
}
