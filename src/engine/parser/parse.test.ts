/**
 * Tests for recursive descent parser
 * 
 * Tests required (from tasks.md):
 * - FIRST/FOLLOW for expression nonterminals (done in firstFollow.test.ts)
 * - Precedence and associativity: 1-2-3, 2^3^2, -2^2, a*b+c
 * - Function calls with 0, 1, 2 arguments
 * - Parameter declarations
 * - Flags like (clock-driven)
 * - Multi-line programs parse line by line
 * - Leftmost derivation matches hand-derived
 */

import { describe, it, expect } from 'vitest';
import { parse } from './parse';
import { prettyPrint } from './ast';
import type { BinaryOpNode, UnaryOpNode, FunctionCallNode } from './ast';

describe('parse - precedence and associativity', () => {
  it('parses 1 - 2 - 3 as left-associative ((1-2)-3)', () => {
    const result = parse('x = 1 - 2 - 3 : m');
    expect(result.ok).toBe(true);
    
    if (!result.ok) return;
    const eq = result.value.ast.lines[0]?.statement;
    expect(eq?.kind).toBe('Equation');
    
    if (eq?.kind !== 'Equation') return;
    const expr = eq.expr;
    
    // Should be BinaryOp '-' with left = BinaryOp '-'
    expect(expr.kind).toBe('BinaryOp');
    const outerOp = expr as BinaryOpNode;
    expect(outerOp.op).toBe('-');
    
    // Left side should be (1 - 2)
    expect(outerOp.left.kind).toBe('BinaryOp');
    const innerOp = outerOp.left as BinaryOpNode;
    expect(innerOp.op).toBe('-');
    
    // Right side should be 3
    expect(outerOp.right.kind).toBe('NumberLiteral');
  });
  
  it('parses 2^3^2 as right-associative (2^(3^2))', () => {
    const result = parse('x = 2^3^2 : m');
    expect(result.ok).toBe(true);
    
    if (!result.ok) return;
    const eq = result.value.ast.lines[0]?.statement;
    expect(eq?.kind).toBe('Equation');
    
    if (eq?.kind !== 'Equation') return;
    const expr = eq.expr;
    
    // Should be BinaryOp '^' with right = BinaryOp '^'
    expect(expr.kind).toBe('BinaryOp');
    const outerOp = expr as BinaryOpNode;
    expect(outerOp.op).toBe('^');
    
    // Left side should be 2
    expect(outerOp.left.kind).toBe('NumberLiteral');
    
    // Right side should be (3 ^ 2)
    expect(outerOp.right.kind).toBe('BinaryOp');
    const innerOp = outerOp.right as BinaryOpNode;
    expect(innerOp.op).toBe('^');
  });
  
  it('parses -2^2 with power binding tighter (-(2^2))', () => {
    const result = parse('x = -2^2 : m');
    expect(result.ok).toBe(true);
    
    if (!result.ok) return;
    const eq = result.value.ast.lines[0]?.statement;
    expect(eq?.kind).toBe('Equation');
    
    if (eq?.kind !== 'Equation') return;
    const expr = eq.expr;
    
    // Should be UnaryOp '-' with operand = BinaryOp '^'
    expect(expr.kind).toBe('UnaryOp');
    const unary = expr as UnaryOpNode;
    expect(unary.op).toBe('-');
    
    expect(unary.operand.kind).toBe('BinaryOp');
    const power = unary.operand as BinaryOpNode;
    expect(power.op).toBe('^');
  });
  
  it('parses a * b + c with correct precedence ((a*b)+c)', () => {
    const result = parse('x = a * b + c : m');
    expect(result.ok).toBe(true);
    
    if (!result.ok) return;
    const eq = result.value.ast.lines[0]?.statement;
    expect(eq?.kind).toBe('Equation');
    
    if (eq?.kind !== 'Equation') return;
    const expr = eq.expr;
    
    // Should be BinaryOp '+' with left = BinaryOp '*'
    expect(expr.kind).toBe('BinaryOp');
    const add = expr as BinaryOpNode;
    expect(add.op).toBe('+');
    
    // Left should be a * b
    expect(add.left.kind).toBe('BinaryOp');
    const mult = add.left as BinaryOpNode;
    expect(mult.op).toBe('*');
  });
  
  it('parses ** as power operator', () => {
    const result = parse('x = 2**3 : m');
    expect(result.ok).toBe(true);
    
    if (!result.ok) return;
    const eq = result.value.ast.lines[0]?.statement;
    expect(eq?.kind).toBe('Equation');
    
    if (eq?.kind !== 'Equation') return;
    const expr = eq.expr;
    
    expect(expr.kind).toBe('BinaryOp');
    const power = expr as BinaryOpNode;
    expect(power.op).toBe('**');
  });
});

describe('parse - function calls', () => {
  it('parses function call with 0 arguments', () => {
    const result = parse('x = foo() : m');
    expect(result.ok).toBe(true);
    
    if (!result.ok) return;
    const eq = result.value.ast.lines[0]?.statement;
    expect(eq?.kind).toBe('Equation');
    
    if (eq?.kind !== 'Equation') return;
    const expr = eq.expr;
    
    expect(expr.kind).toBe('FunctionCall');
    const fn = expr as FunctionCallNode;
    expect(fn.name).toBe('foo');
    expect(fn.args.length).toBe(0);
  });
  
  it('parses function call with 1 argument', () => {
    const result = parse('x = sin(a) : m');
    expect(result.ok).toBe(true);
    
    if (!result.ok) return;
    const eq = result.value.ast.lines[0]?.statement;
    expect(eq?.kind).toBe('Equation');
    
    if (eq?.kind !== 'Equation') return;
    const expr = eq.expr;
    
    expect(expr.kind).toBe('FunctionCall');
    const fn = expr as FunctionCallNode;
    expect(fn.name).toBe('sin');
    expect(fn.args.length).toBe(1);
  });
  
  it('parses function call with 2 arguments', () => {
    const result = parse('x = max(a, b) : m');
    expect(result.ok).toBe(true);
    
    if (!result.ok) return;
    const eq = result.value.ast.lines[0]?.statement;
    expect(eq?.kind).toBe('Equation');
    
    if (eq?.kind !== 'Equation') return;
    const expr = eq.expr;
    
    expect(expr.kind).toBe('FunctionCall');
    const fn = expr as FunctionCallNode;
    expect(fn.name).toBe('max');
    expect(fn.args.length).toBe(2);
  });
  
  it('parses nested function calls', () => {
    const result = parse('x = sin(cos(y)) : m');
    expect(result.ok).toBe(true);
    
    if (!result.ok) return;
    const eq = result.value.ast.lines[0]?.statement;
    expect(eq?.kind).toBe('Equation');
    
    if (eq?.kind !== 'Equation') return;
    const expr = eq.expr;
    
    expect(expr.kind).toBe('FunctionCall');
    const outer = expr as FunctionCallNode;
    expect(outer.name).toBe('sin');
    expect(outer.args[0]?.kind).toBe('FunctionCall');
    
    const inner = outer.args[0] as FunctionCallNode;
    expect(inner.name).toBe('cos');
  });
});

describe('parse - declarations and statements', () => {
  it('parses parameter declaration', () => {
    const result = parse('tau : s');
    expect(result.ok).toBe(true);
    
    if (!result.ok) return;
    const stmt = result.value.ast.lines[0]?.statement;
    expect(stmt?.kind).toBe('ParamDecl');
    
    if (stmt?.kind !== 'ParamDecl') return;
    expect(stmt.name).toBe('tau');
  });
  
  it('parses equation with IDENT lhs', () => {
    const result = parse('v = R * I : V');
    expect(result.ok).toBe(true);
    
    if (!result.ok) return;
    const stmt = result.value.ast.lines[0]?.statement;
    expect(stmt?.kind).toBe('Equation');
    
    if (stmt?.kind !== 'Equation') return;
    expect(stmt.lhs.kind).toBe('IdentLhs');
  });
  
  it('parses equation with DIFF lhs', () => {
    const result = parse('dv/dt = I : V');
    expect(result.ok).toBe(true);
    
    if (!result.ok) return;
    const stmt = result.value.ast.lines[0]?.statement;
    expect(stmt?.kind).toBe('Equation');
    
    if (stmt?.kind !== 'Equation') return;
    expect(stmt.lhs.kind).toBe('DiffLhs');
  });
  
  it('parses single flag', () => {
    const result = parse('tau : s (constant)');
    expect(result.ok).toBe(true);
    
    if (!result.ok) return;
    const stmt = result.value.ast.lines[0]?.statement;
    expect(stmt?.kind).toBe('ParamDecl');
    
    if (stmt?.kind !== 'ParamDecl') return;
    expect(stmt.flags.length).toBe(1);
    expect(stmt.flags[0]?.parts).toEqual(['constant']);
  });
  
  it('parses hyphenated flag (clock-driven)', () => {
    const result = parse('clk : s (clock-driven)');
    expect(result.ok).toBe(true);
    
    if (!result.ok) return;
    const stmt = result.value.ast.lines[0]?.statement;
    expect(stmt?.kind).toBe('ParamDecl');
    
    if (stmt?.kind !== 'ParamDecl') return;
    expect(stmt.flags.length).toBe(1);
    expect(stmt.flags[0]?.parts).toEqual(['clock', 'driven']);
  });
  
  it('parses multiple flags', () => {
    const result = parse('x : m (shared, constant)');
    expect(result.ok).toBe(true);
    
    if (!result.ok) return;
    const stmt = result.value.ast.lines[0]?.statement;
    expect(stmt?.kind).toBe('ParamDecl');
    
    if (stmt?.kind !== 'ParamDecl') return;
    expect(stmt.flags.length).toBe(2);
  });
});

describe('parse - multi-line programs', () => {
  it('parses multi-line program correctly', () => {
    const source = `tau : s
v = R * I : V
dv/dt = I : V`;
    
    const result = parse(source);
    expect(result.ok).toBe(true);
    
    if (!result.ok) return;
    expect(result.value.ast.lines.length).toBe(3);
    expect(result.value.ast.lines[0]?.statement?.kind).toBe('ParamDecl');
    expect(result.value.ast.lines[1]?.statement?.kind).toBe('Equation');
    expect(result.value.ast.lines[2]?.statement?.kind).toBe('Equation');
  });
  
  it('handles blank lines', () => {
    const source = `tau : s

v = 1 : V`;
    
    const result = parse(source);
    expect(result.ok).toBe(true);
    
    if (!result.ok) return;
    expect(result.value.ast.lines.length).toBe(3);
    expect(result.value.ast.lines[1]?.statement).toBeNull();
  });
  
  it('handles comments', () => {
    const source = `tau : s # time constant
# voltage equation
v = R * I : V`;
    
    const result = parse(source);
    expect(result.ok).toBe(true);
    
    if (!result.ok) return;
    expect(result.value.ast.lines[0]?.trailingComment).toBe('time constant');
  });
});

describe('parse - unit expressions', () => {
  it('parses unit with power', () => {
    const result = parse('a : m^2');
    expect(result.ok).toBe(true);
    
    if (!result.ok) return;
    const stmt = result.value.ast.lines[0]?.statement;
    expect(stmt?.kind).toBe('ParamDecl');
    
    if (stmt?.kind !== 'ParamDecl') return;
    expect(stmt.unit.kind).toBe('UnitPower');
  });
  
  it('parses unit with negative power', () => {
    const result = parse('f : s^-1');
    expect(result.ok).toBe(true);
    
    if (!result.ok) return;
    const stmt = result.value.ast.lines[0]?.statement;
    expect(stmt?.kind).toBe('ParamDecl');
    
    if (stmt?.kind !== 'ParamDecl') return;
    expect(stmt.unit.kind).toBe('UnitPower');
  });
  
  it('parses complex unit expression', () => {
    const result = parse('v : kg * m^2 / s^3 / A');
    expect(result.ok).toBe(true);
    
    if (!result.ok) return;
    const stmt = result.value.ast.lines[0]?.statement;
    expect(stmt?.kind).toBe('ParamDecl');
    
    if (stmt?.kind !== 'ParamDecl') return;
    expect(stmt.unit.kind).toBe('UnitBinaryOp');
  });
});

describe('parse - round-trip oracle', () => {
  it('round-trips simple equation', () => {
    const source = 'v = R * I : V';
    const result = parse(source);
    expect(result.ok).toBe(true);
    
    if (!result.ok) return;
    const printed = prettyPrint(result.value.ast);
    const reparsed = parse(printed);
    expect(reparsed.ok).toBe(true);
    
    // ASTs should be equivalent (we can check structure)
    if (!reparsed.ok) return;
    expect(reparsed.value.ast.lines.length).toBe(result.value.ast.lines.length);
  });
  
  it('round-trips complex expression', () => {
    const source = 'x = a * b + c^2 - sin(y) : m';
    const result = parse(source);
    expect(result.ok).toBe(true);
    
    if (!result.ok) return;
    const printed = prettyPrint(result.value.ast);
    const reparsed = parse(printed);
    expect(reparsed.ok).toBe(true);
  });
});

describe('parse - literals', () => {
  it('parses binary literal', () => {
    const result = parse('x = 0b1010 : m');
    expect(result.ok).toBe(true);
    
    if (!result.ok) return;
    const eq = result.value.ast.lines[0]?.statement;
    expect(eq?.kind).toBe('Equation');
    
    if (eq?.kind !== 'Equation') return;
    expect(eq.expr.kind).toBe('BinaryLiteral');
  });
  
  it('parses octal literal', () => {
    const result = parse('x = 0o17 : m');
    expect(result.ok).toBe(true);
    
    if (!result.ok) return;
    const eq = result.value.ast.lines[0]?.statement;
    expect(eq?.kind).toBe('Equation');
    
    if (eq?.kind !== 'Equation') return;
    expect(eq.expr.kind).toBe('OctalLiteral');
  });
  
  it('parses hex literal', () => {
    const result = parse('x = 0xFF : m');
    expect(result.ok).toBe(true);
    
    if (!result.ok) return;
    const eq = result.value.ast.lines[0]?.statement;
    expect(eq?.kind).toBe('Equation');
    
    if (eq?.kind !== 'Equation') return;
    expect(eq.expr.kind).toBe('HexLiteral');
  });
  
  it('parses decimal with exponent', () => {
    const result = parse('x = 1e-3 : m');
    expect(result.ok).toBe(true);
    
    if (!result.ok) return;
    const eq = result.value.ast.lines[0]?.statement;
    expect(eq?.kind).toBe('Equation');
    
    if (eq?.kind !== 'Equation') return;
    expect(eq.expr.kind).toBe('NumberLiteral');
  });
});
