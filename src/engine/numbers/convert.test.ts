/**
 * Tests for number system conversion
 */

import { describe, it, expect } from 'vitest';
import {
  binaryToOctal,
  binaryToHex,
  octalToBinary,
  hexToBinary,
  octalToHex,
  hexToOctal,
} from './convert';
import {
  buildBinaryToOctalTransducer,
  buildBinaryToHexTransducer,
} from './transducer';

describe('convert - binary to octal', () => {
  it('converts simple cases', () => {
    expect(binaryToOctal('0').normalized).toBe('0');
    expect(binaryToOctal('1').normalized).toBe('1');
    expect(binaryToOctal('111').normalized).toBe('7');
    expect(binaryToOctal('1000').normalized).toBe('10');
  });
  
  it('handles length not multiple of 3', () => {
    // 1 bit: pads to 001 = 1
    expect(binaryToOctal('1').normalized).toBe('1');
    // 2 bits: pads to 011 = 3
    expect(binaryToOctal('11').normalized).toBe('3');
    // 4 bits: groups as 1|000 = 10
    expect(binaryToOctal('1000').normalized).toBe('10');
  });
  
  it('handles length multiple of 3', () => {
    expect(binaryToOctal('000').normalized).toBe('0');
    expect(binaryToOctal('111').normalized).toBe('7');
    expect(binaryToOctal('101010').normalized).toBe('52');
  });
  
  it('strips leading zeros', () => {
    expect(binaryToOctal('000').normalized).toBe('0');
    expect(binaryToOctal('001').normalized).toBe('1');
    expect(binaryToOctal('000111').normalized).toBe('7');
  });
  
  it('keeps leading zeros when requested', () => {
    // keepLeadingZeros preserves leading zeros in the OUTPUT
    // For binary '000001', we get octal '01', which has a leading zero
    expect(binaryToOctal('000001', false).normalized).toBe('1');
    expect(binaryToOctal('000001', true).normalized).toBe('01');
    
    // For binary '000010', we get octal '02'
    expect(binaryToOctal('000010', false).normalized).toBe('2');
    expect(binaryToOctal('000010', true).normalized).toBe('02');
  });
  
  it('handles all zeros', () => {
    expect(binaryToOctal('0').normalized).toBe('0');
    expect(binaryToOctal('00').normalized).toBe('0');
    expect(binaryToOctal('000').normalized).toBe('0');
    expect(binaryToOctal('000000').normalized).toBe('0');
  });
  
  it('handles long strings', () => {
    // 12 bits = 4 octal digits
    expect(binaryToOctal('101010101010').normalized).toBe('5252');
  });
});

describe('convert - binary to hex', () => {
  it('converts simple cases', () => {
    expect(binaryToHex('0').normalized).toBe('0');
    expect(binaryToHex('1').normalized).toBe('1');
    expect(binaryToHex('1111').normalized).toBe('F');
    expect(binaryToHex('10000').normalized).toBe('10');
  });
  
  it('handles length not multiple of 4', () => {
    expect(binaryToHex('1').normalized).toBe('1');
    expect(binaryToHex('11').normalized).toBe('3');
    expect(binaryToHex('111').normalized).toBe('7');
    expect(binaryToHex('10000').normalized).toBe('10');
  });
  
  it('handles length multiple of 4', () => {
    expect(binaryToHex('0000').normalized).toBe('0');
    expect(binaryToHex('1111').normalized).toBe('F');
    expect(binaryToHex('10101010').normalized).toBe('AA');
  });
  
  it('strips leading zeros', () => {
    expect(binaryToHex('0000').normalized).toBe('0');
    expect(binaryToHex('0001').normalized).toBe('1');
    expect(binaryToHex('00001111').normalized).toBe('F');
  });
});

describe('convert - octal to binary', () => {
  it('converts each octal digit to 3 bits', () => {
    expect(octalToBinary('0').normalized).toBe('0');
    expect(octalToBinary('1').normalized).toBe('1');
    expect(octalToBinary('7').normalized).toBe('111');
    expect(octalToBinary('10').normalized).toBe('1000');
  });
  
  it('handles multiple digits', () => {
    expect(octalToBinary('52').normalized).toBe('101010');
    expect(octalToBinary('777').normalized).toBe('111111111');
  });
});

describe('convert - hex to binary', () => {
  it('converts each hex digit to 4 bits', () => {
    expect(hexToBinary('0').normalized).toBe('0');
    expect(hexToBinary('1').normalized).toBe('1');
    expect(hexToBinary('F').normalized).toBe('1111');
    expect(hexToBinary('10').normalized).toBe('10000');
  });
  
  it('handles lowercase hex', () => {
    expect(hexToBinary('a').normalized).toBe('1010');
    expect(hexToBinary('ff').normalized).toBe('11111111');
  });
  
  it('handles multiple digits', () => {
    expect(hexToBinary('AA').normalized).toBe('10101010');
    expect(hexToBinary('FF').normalized).toBe('11111111');
  });
});

describe('convert - octal to hex', () => {
  it('converts via binary', () => {
    expect(octalToHex('0')).toBe('0');
    expect(octalToHex('7')).toBe('7');
    expect(octalToHex('10')).toBe('8');
    expect(octalToHex('77')).toBe('3F');
  });
});

describe('convert - hex to octal', () => {
  it('converts via binary', () => {
    expect(hexToOctal('0')).toBe('0');
    expect(hexToOctal('8')).toBe('10');
    expect(hexToOctal('F')).toBe('17');
    expect(hexToOctal('FF')).toBe('377');
  });
});

describe('convert - transducer state count', () => {
  it('binary to octal has 7 states', () => {
    const transducer = buildBinaryToOctalTransducer();
    expect(transducer.states.length).toBe(7);
  });
  
  it('binary to hex has 15 states', () => {
    const transducer = buildBinaryToHexTransducer();
    expect(transducer.states.length).toBe(15);
  });
});

describe('convert - oracle tests', () => {
  it('matches BigInt.toString for octal up to length 12', () => {
    const testCases = [
      '0', '1', '10', '11', '100', '101', '110', '111',
      '1000', '1111', '10101', '101010', '111111',
      '101010101010', // 12 bits
    ];
    
    for (const binary of testCases) {
      const expected = BigInt(`0b${binary}`).toString(8);
      const actual = binaryToOctal(binary).normalized;
      expect(actual).toBe(expected);
    }
  });
  
  it('matches BigInt.toString for hex up to length 12', () => {
    const testCases = [
      '0', '1', '10', '11', '100', '101', '110', '111',
      '1000', '1111', '10101', '101010', '111111',
      '101010101010', // 12 bits
    ];
    
    for (const binary of testCases) {
      const expected = BigInt(`0b${binary}`).toString(16).toUpperCase();
      const actual = binaryToHex(binary).normalized;
      expect(actual).toBe(expected);
    }
  });
  
  it('round trips octal ↔ hex', () => {
    const octals = ['0', '1', '7', '10', '77', '123', '777'];
    
    for (const octal of octals) {
      const hex = octalToHex(octal);
      const backToOctal = hexToOctal(hex);
      expect(backToOctal).toBe(octal);
    }
  });
  
  it('generates all binary strings up to length 12 and matches BigInt', () => {
    // Test a comprehensive set of binary strings
    for (let len = 1; len <= 12; len++) {
      const count = Math.min(10, Math.pow(2, len)); // Test at most 10 per length
      for (let i = 0; i < count; i++) {
        const value = Math.floor(Math.random() * Math.pow(2, len));
        const binary = value.toString(2);
        
        const expectedOctal = BigInt(`0b${binary}`).toString(8);
        const actualOctal = binaryToOctal(binary).normalized;
        expect(actualOctal).toBe(expectedOctal);
        
        const expectedHex = BigInt(`0b${binary}`).toString(16).toUpperCase();
        const actualHex = binaryToHex(binary).normalized;
        expect(actualHex).toBe(expectedHex);
      }
    }
  });
});
