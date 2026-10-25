/**
 * Number system conversion using transducers
 * 
 * Binary ↔ Octal ↔ Hex conversions using LSB-first processing
 */

import {
  buildBinaryToOctalTransducer,
  buildBinaryToHexTransducer,
  buildOctalToBinaryTransducer,
  buildHexToBinaryTransducer,
  runTransducer,
  type Transducer,
  type TransducerResult,
} from './transducer';

export interface ConversionResult extends TransducerResult {
  transducer: Transducer;
  normalized: string; // Final result after reversing and stripping zeros
}

/**
 * Convert binary to octal (LSB first processing)
 */
export function binaryToOctal(binary: string, keepLeadingZeros = false): ConversionResult {
  const transducer = buildBinaryToOctalTransducer();
  
  // Process LSB first (reverse the input)
  const reversed = binary.split('').reverse().join('');
  const result = runTransducer(transducer, reversed);
  
  // Reverse output to get normal order
  const reversedOutput = result.output.split('').reverse().join('');
  
  // Strip leading zeros (keep at least one '0')
  const normalized = keepLeadingZeros
    ? reversedOutput
    : reversedOutput.replace(/^0+(?=.)/, '') || '0';
  
  return {
    ...result,
    transducer,
    normalized,
  };
}

/**
 * Convert binary to hexadecimal (LSB first processing)
 */
export function binaryToHex(binary: string, keepLeadingZeros = false): ConversionResult {
  const transducer = buildBinaryToHexTransducer();
  
  // Process LSB first (reverse the input)
  const reversed = binary.split('').reverse().join('');
  const result = runTransducer(transducer, reversed);
  
  // Reverse output to get normal order
  const reversedOutput = result.output.split('').reverse().join('');
  
  // Strip leading zeros (keep at least one '0')
  const normalized = keepLeadingZeros
    ? reversedOutput
    : reversedOutput.replace(/^0+(?=.)/, '') || '0';
  
  return {
    ...result,
    transducer,
    normalized,
  };
}

/**
 * Convert octal to binary
 */
export function octalToBinary(octal: string): ConversionResult {
  const transducer = buildOctalToBinaryTransducer();
  const result = runTransducer(transducer, octal);
  
  // Strip leading zeros from binary
  const normalized = result.output.replace(/^0+(?=.)/, '') || '0';
  
  return {
    ...result,
    transducer,
    normalized,
  };
}

/**
 * Convert hexadecimal to binary
 */
export function hexToBinary(hex: string): ConversionResult {
  const transducer = buildHexToBinaryTransducer();
  const result = runTransducer(transducer, hex.toUpperCase());
  
  // Strip leading zeros from binary
  const normalized = result.output.replace(/^0+(?=.)/, '') || '0';
  
  return {
    ...result,
    transducer,
    normalized,
  };
}

/**
 * Convert octal to hexadecimal (via binary)
 */
export function octalToHex(octal: string, keepLeadingZeros = false): string {
  const binary = octalToBinary(octal).normalized;
  return binaryToHex(binary, keepLeadingZeros).normalized;
}

/**
 * Convert hexadecimal to octal (via binary)
 */
export function hexToOctal(hex: string, keepLeadingZeros = false): string {
  const binary = hexToBinary(hex).normalized;
  return binaryToOctal(binary, keepLeadingZeros).normalized;
}
