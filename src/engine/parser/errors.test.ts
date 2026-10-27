/**
 * Tests for error handling and rendering (T12)
 * 
 * Tests against Appendix B fixtures and error rendering
 */

import { describe, it, expect } from 'vitest';
import { parse } from './parse';
import { renderError } from './errorRenderer';

describe('T12 - Appendix B invalid fixtures', () => {
  // Helper to add declarations to make a complete program
  const withDecls = (line: string) => `${line}\ntau : second\nI : volt`;
  
  it('detects UNCLOSED_PAREN', () => {
    const source = withDecls('dv/dt = (I - v/tau : volt');
    const result = parse(source);
    
    expect(result.ok).toBe(false);
    if (result.ok) return;
    
    expect(result.error.code).toBe('UNEXPECTED_TOKEN');
    // Parser found the error (missing closing paren before colon)
    expect(result.error.line).toBe(1);
  });
  
  it('detects UNEXPECTED_CLOSE_PAREN', () => {
    const source = withDecls('dv/dt = I - v) / tau : volt');
    const result = parse(source);
    
    expect(result.ok).toBe(false);
    if (result.ok) return;
    
    // Should detect unexpected ) in expression
    expect(result.error.code).toBe('UNEXPECTED_TOKEN');
  });
  
  it('detects MISSING_OPERAND after +', () => {
    const source = withDecls('dv/dt = I + : volt');
    const result = parse(source);
    
    expect(result.ok).toBe(false);
    if (result.ok) return;
    
    expect(result.error.code).toBe('UNEXPECTED_TOKEN');
    // Colon where operand expected
  });
  
  it('detects MISSING_EQUALS', () => {
    const source = withDecls('dv/dt (I - v)/tau : volt');
    const result = parse(source);
    
    expect(result.ok).toBe(false);
    if (result.ok) return;
    
    expect(result.error.code).toBe('UNEXPECTED_TOKEN');
    // Expected EQUALS after lhs
  });
  
  it('detects MISSING_UNIT (missing colon and unit)', () => {
    const source = withDecls('dv/dt = (I - v)/tau');
    const result = parse(source);
    
    expect(result.ok).toBe(false);
    if (result.ok) return;
    
    // Parser expects colon after expression, finds newline instead
    expect(result.error.code).toBe('UNEXPECTED_TOKEN');
  });
  
  it('detects double operator (MISSING_OPERAND)', () => {
    const source = withDecls('dv/dt = I * + / tau : volt');
    const result = parse(source);
    
    expect(result.ok).toBe(false);
    if (result.ok) return;
    
    expect(result.error.code).toBe('UNEXPECTED_TOKEN');
    // + where operand expected
  });
  
  it('detects UNEXPECTED_CHARACTER from lexer', () => {
    const source = withDecls('dv/dt = I @ v : volt');
    const result = parse(source);
    
    expect(result.ok).toBe(false);
    if (result.ok) return;
    
    expect(result.error.code).toBe('UNEXPECTED_CHARACTER');
  });
  
  // Note: UNKNOWN_UNIT and UNIT_MISMATCH will be implemented in T13
  // For now, they parse successfully (unit checking not yet implemented)
  it('parses unknown unit (UNKNOWN_UNIT deferred to T13)', () => {
    const source = withDecls('dv/dt = (I - v)/tau : volts');
    const result = parse(source);
    
    // Parser accepts any identifier as unit; semantic check in T13
    expect(result.ok).toBe(true);
  });
  
  it('parses mismatched units (UNIT_MISMATCH deferred to T13)', () => {
    const source = withDecls('dv/dt = I + tau : volt');
    const result = parse(source);
    
    // Parser accepts expression; unit check in T13
    expect(result.ok).toBe(true);
  });
});

describe('T12 - Error rendering', () => {
  it('renders error with caret at correct position', () => {
    const source = 'dv/dt = (I - v/tau : volt';
    const result = parse(source);
    
    expect(result.ok).toBe(false);
    if (result.ok) return;
    
    const rendered = renderError(result.error, source);
    
    // Should show source line
    expect(rendered).toContain('dv/dt = (I - v/tau : volt');
    
    // Should show caret
    expect(rendered).toContain('^');
    
    // Should show error code
    expect(rendered).toContain('UNEXPECTED_TOKEN');
  });
  
  it('renders multi-line error correctly', () => {
    const source = 'x = 1 : m\ny = 2 @ 3 : m';
    const result = parse(source);
    
    expect(result.ok).toBe(false);
    if (result.ok) return;
    
    const rendered = renderError(result.error, source);
    
    // Should show the line with the error (line 2)
    expect(rendered).toContain('y = 2 @ 3 : m');
    expect(rendered).toContain('UNEXPECTED_CHARACTER');
    expect(rendered).toContain('line 2');
  });
  
  it('formats caret with correct column position', () => {
    const source = 'x = ( 1 + : m';
    const result = parse(source);
    
    expect(result.ok).toBe(false);
    if (result.ok) return;
    
    const rendered = renderError(result.error, source);
    const lines = rendered.split('\n');
    
    // First line is source, second is caret
    expect(lines[0]).toBe('x = ( 1 + : m');
    expect(lines[1]).toMatch(/^\s*\^/); // Caret with leading spaces
  });
});

describe('T12 - Comment annotations', () => {
  it('preserves trailing comment', () => {
    const source = 'tau : second # time constant';
    const result = parse(source);
    
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    const line = result.value.ast.lines[0];
    expect(line?.trailingComment).toBe('time constant');
  });
  
  it('handles comment-only line', () => {
    const source = '# This is a comment\ntau : second';
    const result = parse(source);
    
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    expect(result.value.ast.lines.length).toBe(2);
    expect(result.value.ast.lines[0]?.statement).toBeNull();
    expect(result.value.ast.lines[0]?.trailingComment).toBe('This is a comment');
  });
  
  it('preserves multiple comments', () => {
    const source = `# Header comment
tau : second # inline comment
# Another comment`;
    
    const result = parse(source);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    // All three lines should be parsed
    expect(result.value.ast.lines.length).toBe(3);
    
    // First line: comment only
    expect(result.value.ast.lines[0]?.statement).toBeNull();
    
    // Second line: statement with trailing comment
    expect(result.value.ast.lines[1]?.statement).not.toBeNull();
    expect(result.value.ast.lines[1]?.trailingComment).toBe('inline comment');
    
    // Third line: comment only
    expect(result.value.ast.lines[2]?.statement).toBeNull();
  });
  
  it('comments do not affect AST structure', () => {
    const source1 = 'tau : second';
    const source2 = 'tau : second # with comment';
    
    const result1 = parse(source1);
    const result2 = parse(source2);
    
    expect(result1.ok).toBe(true);
    expect(result2.ok).toBe(true);
    
    if (!result1.ok || !result2.ok) return;
    
    const stmt1 = result1.value.ast.lines[0]?.statement;
    const stmt2 = result2.value.ast.lines[0]?.statement;
    
    // Both should be ParamDecl with same name
    expect(stmt1?.kind).toBe('ParamDecl');
    expect(stmt2?.kind).toBe('ParamDecl');
    
    if (stmt1?.kind === 'ParamDecl' && stmt2?.kind === 'ParamDecl') {
      expect(stmt1.name).toBe(stmt2.name);
    }
  });
});

describe('T12 - Valid Appendix B fixture', () => {
  it('parses valid leaky integrate-and-fire neuron', () => {
    const source = `# leaky integrate-and-fire neuron
dv/dt = (I - v)/tau : volt      # membrane potential
tau : second (constant)
I : volt`;
    
    const result = parse(source);
    expect(result.ok).toBe(true);
    
    if (!result.ok) return;
    
    // Should have 4 lines
    expect(result.value.ast.lines.length).toBe(4);
    
    // Line 1: comment only
    expect(result.value.ast.lines[0]?.statement).toBeNull();
    
    // Line 2: differential equation with comment
    const eq = result.value.ast.lines[1]?.statement;
    expect(eq?.kind).toBe('Equation');
    expect(result.value.ast.lines[1]?.trailingComment).toBe('membrane potential');
    
    // Line 3: parameter with constant flag
    const tau = result.value.ast.lines[2]?.statement;
    expect(tau?.kind).toBe('ParamDecl');
    if (tau?.kind === 'ParamDecl') {
      expect(tau.name).toBe('tau');
      expect(tau.flags.length).toBe(1);
      expect(tau.flags[0]?.parts).toEqual(['constant']);
    }
    
    // Line 4: parameter
    const I = result.value.ast.lines[3]?.statement;
    expect(I?.kind).toBe('ParamDecl');
  });
});
