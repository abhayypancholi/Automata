/**
 * Tests for unit checker (T13)
 */

import { describe, it, expect } from 'vitest';
import { parse } from '../parser/parse';
import { checkProgram } from './check';
import { format, nameOf, mul, div, pow, equal, DIMENSIONLESS } from './dimension';
import { lookupUnit } from './unitTable';

describe('T13 - Dimension arithmetic', () => {
  it('multiplies dimensions correctly', () => {
    const m = lookupUnit('m')!;
    const s = lookupUnit('s')!;
    const result = mul(m, s);  // m⋅s
    
    expect(result[0]).toBe(1); // Length
    expect(result[2]).toBe(1); // Time
  });
  
  it('divides dimensions correctly', () => {
    const m = lookupUnit('m')!;
    const s = lookupUnit('s')!;
    const result = div(m, s);  // m/s
    
    expect(result[0]).toBe(1);  // Length
    expect(result[2]).toBe(-1); // Time^-1
  });
  
  it('raises dimension to power', () => {
    const m = lookupUnit('m')!;
    const result = pow(m, 2);  // m^2
    
    expect(result[0]).toBe(2); // Length^2
  });
});

describe('T13 - nameOf function', () => {
  it('recognizes volt', () => {
    const V = lookupUnit('V')!;
    expect(nameOf(V)).toBe('V');
  });
  
  it('recognizes ohm', () => {
    const ohm = lookupUnit('ohm')!;
    expect(nameOf(ohm)).toBe('Ω');
  });
  
  it('recognizes siemens', () => {
    const S = lookupUnit('S')!;
    expect(nameOf(S)).toBe('S');
  });
  
  it('recognizes farad', () => {
    const F = lookupUnit('F')!;
    expect(nameOf(F)).toBe('F');
  });
  
  it('recognizes hertz', () => {
    const Hz = lookupUnit('Hz')!;
    expect(nameOf(Hz)).toBe('Hz');
  });
});

describe('T13 - format function', () => {
  it('formats dimensionless as 1', () => {
    expect(format(DIMENSIONLESS)).toBe('1');
  });
  
  it('formats simple dimension', () => {
    const m = lookupUnit('m')!;
    expect(format(m)).toBe('m');
  });
  
  it('formats compound dimension', () => {
    const V = lookupUnit('V')!;
    const formatted = format(V);
    // V = kg⋅m^2⋅s^-3⋅A^-1
    expect(formatted).toContain('m^2');
    expect(formatted).toContain('kg');
    expect(formatted).toContain('s^-3');
    expect(formatted).toContain('A^-1');
  });
});

describe('T13 - Unit mismatch detection (R13.3)', () => {
  it('detects addition of mismatched units', () => {
    const source = `I : volt\ntau : second\ndv/dt = I + tau : volt`;
    const result = parse(source);
    expect(result.ok).toBe(true);
    
    if (!result.ok) return;
    const checkResult = checkProgram(result.value.ast);
    
    expect(checkResult.ok).toBe(false);
    if (checkResult.ok) return;
    expect(checkResult.error.code).toBe('UNIT_MISMATCH');
  });
  
  it('allows addition of same units', () => {
    const source = `a : volt\nb : volt\nx = a + b : volt`;
    const result = parse(source);
    expect(result.ok).toBe(true);
    
    if (!result.ok) return;
    const checkResult = checkProgram(result.value.ast);
    
    expect(checkResult.ok).toBe(true);
  });
});

describe('T13 - Dimension computation (R13.4)', () => {
  it('computes multiplication correctly', () => {
    const source = `R : ohm\nI : A\nv = R * I : V`;
    const result = parse(source);
    expect(result.ok).toBe(true);
    
    if (!result.ok) return;
    const checkResult = checkProgram(result.value.ast);
    
    expect(checkResult.ok).toBe(true);
  });
  
  it('computes division correctly', () => {
    const source = `v : V\nI : A\nR = v / I : ohm`;
    const result = parse(source);
    expect(result.ok).toBe(true);
    
    if (!result.ok) return;
    const checkResult = checkProgram(result.value.ast);
    
    expect(checkResult.ok).toBe(true);
  });
  
  it('allows v^2 with integer exponent', () => {
    const source = `v : m\na = v^2 : m^2`;
    const result = parse(source);
    expect(result.ok).toBe(true);
    
    if (!result.ok) return;
    const checkResult = checkProgram(result.value.ast);
    
    expect(checkResult.ok).toBe(true);
  });
  
  it('allows v^-1 with negative integer exponent', () => {
    const source = `v : m\nf = v^-1 : m^-1`;
    const result = parse(source);
    expect(result.ok).toBe(true);
    
    if (!result.ok) return;
    const checkResult = checkProgram(result.value.ast);
    
    expect(checkResult.ok).toBe(true);
  });
  
  it('rejects v^0.5 with non-integer exponent on dimensional base', () => {
    const source = `v : m\nx = v^0.5 : m`;
    const result = parse(source);
    expect(result.ok).toBe(true);
    
    if (!result.ok) return;
    const checkResult = checkProgram(result.value.ast);
    
    // Non-integer literal on dimensional base should error
    expect(checkResult.ok).toBe(false);
    if (checkResult.ok) return;
    expect(checkResult.error.code).toBe('UNIT_MISMATCH');
  });
});

describe('T13 - Function dimension checking (R13.5)', () => {
  it('requires dimensionless argument for exp', () => {
    const source = `v : volt\nx = exp(v) : V`;
    const result = parse(source);
    expect(result.ok).toBe(true);
    
    if (!result.ok) return;
    const checkResult = checkProgram(result.value.ast);
    
    expect(checkResult.ok).toBe(false);
    if (checkResult.ok) return;
    expect(checkResult.error.code).toBe('UNIT_MISMATCH');
  });
  
  it('allows dimensionless argument for exp', () => {
    const source = `x : 1\ny = exp(x) : 1`;
    const result = parse(source);
    expect(result.ok).toBe(true);
    
    if (!result.ok) return;
    const checkResult = checkProgram(result.value.ast);
    
    expect(checkResult.ok).toBe(true);
  });
  
  it('abs preserves dimension', () => {
    const source = `v : volt\na = abs(v) : volt`;
    const result = parse(source);
    expect(result.ok).toBe(true);
    
    if (!result.ok) return;
    const checkResult = checkProgram(result.value.ast);
    
    expect(checkResult.ok).toBe(true);
  });
});

describe('T13 - RHS vs declared unit (R13.6)', () => {
  it('detects mismatch in simple equation', () => {
    const source = `I : A\nv = I : volt`;
    const result = parse(source);
    expect(result.ok).toBe(true);
    
    if (!result.ok) return;
    const checkResult = checkProgram(result.value.ast);
    
    expect(checkResult.ok).toBe(false);
    if (checkResult.ok) return;
    expect(checkResult.error.code).toBe('UNIT_MISMATCH');
  });
  
  it('allows matching units', () => {
    const source = `I : A\nv = I : A`;
    const result = parse(source);
    expect(result.ok).toBe(true);
    
    if (!result.ok) return;
    const checkResult = checkProgram(result.value.ast);
    
    expect(checkResult.ok).toBe(true);
  });
});

describe('T13 - Undeclared identifier (R13.7)', () => {
  it('detects undeclared identifier', () => {
    const source = `x = y + 1 : m`;
    const result = parse(source);
    expect(result.ok).toBe(true);
    
    if (!result.ok) return;
    const checkResult = checkProgram(result.value.ast);
    
    expect(checkResult.ok).toBe(false);
    if (checkResult.ok) return;
    expect(checkResult.error.code).toBe('UNDECLARED_IDENTIFIER');
  });
});

describe('T13 - Reserved names (R13.7)', () => {
  it('rejects reserved unit name as variable', () => {
    const source = `volt : m\nx = volt : m`;
    const result = parse(source);
    expect(result.ok).toBe(true);
    
    if (!result.ok) return;
    const checkResult = checkProgram(result.value.ast);
    
    expect(checkResult.ok).toBe(false);
    if (checkResult.ok) return;
    expect(checkResult.error.code).toBe('RESERVED_NAME');
  });
});

describe('T13 - Forward references (R13.8)', () => {
  it('allows forward references', () => {
    const source = `x = y * 2 : m\ny : m`;
    const result = parse(source);
    expect(result.ok).toBe(true);
    
    if (!result.ok) return;
    const checkResult = checkProgram(result.value.ast);
    
    expect(checkResult.ok).toBe(true);
  });
});

describe('T13 - Prefixed units', () => {
  it('treats mV and V as same dimension', () => {
    const mV = lookupUnit('mV');
    const V = lookupUnit('V');
    
    expect(mV).not.toBeNull();
    expect(V).not.toBeNull();
    expect(equal(mV!, V!)).toBe(true);
  });
  
  it('allows mixing mV and V', () => {
    const source = `a : mV\nb : V\nx = a + b : V`;
    const result = parse(source);
    expect(result.ok).toBe(true);
    
    if (!result.ok) return;
    const checkResult = checkProgram(result.value.ast);
    
    expect(checkResult.ok).toBe(true);
  });
});

describe('T13 - Appendix B valid fixture', () => {
  it('passes the leaky integrate-and-fire neuron', () => {
    const source = `# leaky integrate-and-fire neuron
dv/dt = (I - v)/tau : volt
tau : second (constant)
I : volt`;
    
    const result = parse(source);
    expect(result.ok).toBe(true);
    
    if (!result.ok) return;
    const checkResult = checkProgram(result.value.ast);
    
    expect(checkResult.ok).toBe(true);
  });
});

describe('T13 - Unknown function', () => {
  it('detects unknown function', () => {
    const source = `x : 1\ny = foo(x) : 1`;
    const result = parse(source);
    expect(result.ok).toBe(true);
    
    if (!result.ok) return;
    const checkResult = checkProgram(result.value.ast);
    
    expect(checkResult.ok).toBe(false);
    if (checkResult.ok) return;
    expect(checkResult.error.code).toBe('UNKNOWN_FUNCTION');
  });
});

describe('T13 - Wrong arity', () => {
  it('detects wrong number of arguments', () => {
    const source = `x : 1\ny : 1\nz = sin(x, y) : 1`;
    const result = parse(source);
    expect(result.ok).toBe(true);
    
    if (!result.ok) return;
    const checkResult = checkProgram(result.value.ast);
    
    expect(checkResult.ok).toBe(false);
    if (checkResult.ok) return;
    expect(checkResult.error.code).toBe('WRONG_ARITY');
  });
});
