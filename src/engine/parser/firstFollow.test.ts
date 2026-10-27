/**
 * Tests for FIRST and FOLLOW set computation
 * 
 * Hand-derived sets for verification:
 * 
 * Expression grammar (relevant subset):
 * Expr -> Expr '+' Term | Expr '-' Term | Term
 * Term -> Term '*' Factor | Term '/' Factor | Factor
 * Factor -> '+' Factor | '-' Factor | Power
 * Power -> Atom | Atom '^' Factor | Atom '**' Factor
 * Atom -> NUMBER | BIN | OCT | HEX | IDENT | IDENT '(' ArgList ')' | '(' Expr ')'
 * 
 * FIRST sets (hand-derived):
 * FIRST(Expr) = FIRST(Term) = FIRST(Factor) = {PLUS, MINUS, LPAREN, NUMBER, BIN, OCT, HEX, IDENT}
 * FIRST(Power) = FIRST(Atom) = {LPAREN, NUMBER, BIN, OCT, HEX, IDENT}
 * FIRST(ArgList) = {ε, LPAREN, NUMBER, BIN, OCT, HEX, IDENT, PLUS, MINUS}
 * 
 * FOLLOW sets (hand-derived, assuming they appear in equations):
 * FOLLOW(Expr) = {COLON, RPAREN, COMMA, $}  (can be followed by ':', ')', ',', or end)
 * FOLLOW(Term) = FIRST(rest of Expr) ∪ FOLLOW(Expr) = {PLUS, MINUS, COLON, RPAREN, COMMA, $}
 * FOLLOW(Factor) = FIRST(rest of Term) ∪ FOLLOW(Term) = {STAR, SLASH, PLUS, MINUS, COLON, RPAREN, COMMA, $}
 * FOLLOW(Power) = FOLLOW(Factor) = {STAR, SLASH, PLUS, MINUS, COLON, RPAREN, COMMA, $}
 * FOLLOW(Atom) = {CARET, POWER, STAR, SLASH, PLUS, MINUS, COLON, RPAREN, COMMA, $}
 * FOLLOW(ArgList) = {RPAREN}
 */

import { describe, it, expect } from 'vitest';
import { computeFirst, computeFollow, formatFirst, formatFollow } from './firstFollow';
import { originalGrammar } from './grammar';

describe('FIRST/FOLLOW computation', () => {
  describe('FIRST sets', () => {
    it('computes FIRST(Expr) correctly', () => {
      const first = computeFirst(originalGrammar);
      const exprFirst = first.get('Expr');
      
      expect(exprFirst).toBeDefined();
      expect(exprFirst!.has('PLUS')).toBe(true);
      expect(exprFirst!.has('MINUS')).toBe(true);
      expect(exprFirst!.has('LPAREN')).toBe(true);
      expect(exprFirst!.has('NUMBER')).toBe(true);
      expect(exprFirst!.has('BIN')).toBe(true);
      expect(exprFirst!.has('OCT')).toBe(true);
      expect(exprFirst!.has('HEX')).toBe(true);
      expect(exprFirst!.has('IDENT')).toBe(true);
      expect(exprFirst!.has('ε')).toBe(false);
    });
    
    it('computes FIRST(Term) correctly', () => {
      const first = computeFirst(originalGrammar);
      const termFirst = first.get('Term');
      
      expect(termFirst).toBeDefined();
      expect(termFirst!.has('PLUS')).toBe(true);
      expect(termFirst!.has('MINUS')).toBe(true);
      expect(termFirst!.has('LPAREN')).toBe(true);
      expect(termFirst!.has('NUMBER')).toBe(true);
      expect(termFirst!.has('BIN')).toBe(true);
      expect(termFirst!.has('OCT')).toBe(true);
      expect(termFirst!.has('HEX')).toBe(true);
      expect(termFirst!.has('IDENT')).toBe(true);
    });
    
    it('computes FIRST(Factor) correctly', () => {
      const first = computeFirst(originalGrammar);
      const factorFirst = first.get('Factor');
      
      expect(factorFirst).toBeDefined();
      expect(factorFirst!.has('PLUS')).toBe(true);
      expect(factorFirst!.has('MINUS')).toBe(true);
      expect(factorFirst!.has('LPAREN')).toBe(true);
      expect(factorFirst!.has('NUMBER')).toBe(true);
      expect(factorFirst!.has('IDENT')).toBe(true);
    });
    
    it('computes FIRST(Power) correctly', () => {
      const first = computeFirst(originalGrammar);
      const powerFirst = first.get('Power');
      
      expect(powerFirst).toBeDefined();
      expect(powerFirst!.has('LPAREN')).toBe(true);
      expect(powerFirst!.has('NUMBER')).toBe(true);
      expect(powerFirst!.has('BIN')).toBe(true);
      expect(powerFirst!.has('OCT')).toBe(true);
      expect(powerFirst!.has('HEX')).toBe(true);
      expect(powerFirst!.has('IDENT')).toBe(true);
      expect(powerFirst!.has('PLUS')).toBe(false);
      expect(powerFirst!.has('MINUS')).toBe(false);
    });
    
    it('computes FIRST(Atom) correctly', () => {
      const first = computeFirst(originalGrammar);
      const atomFirst = first.get('Atom');
      
      expect(atomFirst).toBeDefined();
      expect(atomFirst!.has('LPAREN')).toBe(true);
      expect(atomFirst!.has('NUMBER')).toBe(true);
      expect(atomFirst!.has('BIN')).toBe(true);
      expect(atomFirst!.has('OCT')).toBe(true);
      expect(atomFirst!.has('HEX')).toBe(true);
      expect(atomFirst!.has('IDENT')).toBe(true);
      expect(atomFirst!.has('PLUS')).toBe(false);
    });
    
    it('computes FIRST(ArgList) includes epsilon', () => {
      const first = computeFirst(originalGrammar);
      const argListFirst = first.get('ArgList');
      
      expect(argListFirst).toBeDefined();
      expect(argListFirst!.has('ε')).toBe(true);
      expect(argListFirst!.has('LPAREN')).toBe(true);
      expect(argListFirst!.has('NUMBER')).toBe(true);
      expect(argListFirst!.has('PLUS')).toBe(true);
      expect(argListFirst!.has('MINUS')).toBe(true);
    });
    
    it('computes FIRST(Flags) includes epsilon', () => {
      const first = computeFirst(originalGrammar);
      const flagsFirst = first.get('Flags');
      
      expect(flagsFirst).toBeDefined();
      expect(flagsFirst!.has('ε')).toBe(true);
      expect(flagsFirst!.has('LPAREN')).toBe(true);
    });
  });
  
  describe('FOLLOW sets', () => {
    it('computes FOLLOW(Expr) correctly', () => {
      const first = computeFirst(originalGrammar);
      const follow = computeFollow(originalGrammar, first);
      const exprFollow = follow.get('Expr');
      
      expect(exprFollow).toBeDefined();
      // Expr appears before ':' in equations, before ')' in parentheses, before ',' in arg lists
      expect(exprFollow!.has('COLON')).toBe(true);
      expect(exprFollow!.has('RPAREN')).toBe(true);
      expect(exprFollow!.has('COMMA')).toBe(true);
    });
    
    it('computes FOLLOW(Term) includes operators', () => {
      const first = computeFirst(originalGrammar);
      const follow = computeFollow(originalGrammar, first);
      const termFollow = follow.get('Term');
      
      expect(termFollow).toBeDefined();
      expect(termFollow!.has('PLUS')).toBe(true);
      expect(termFollow!.has('MINUS')).toBe(true);
      expect(termFollow!.has('COLON')).toBe(true);
      expect(termFollow!.has('RPAREN')).toBe(true);
    });
    
    it('computes FOLLOW(Factor) includes multiplicative ops', () => {
      const first = computeFirst(originalGrammar);
      const follow = computeFollow(originalGrammar, first);
      const factorFollow = follow.get('Factor');
      
      expect(factorFollow).toBeDefined();
      expect(factorFollow!.has('STAR')).toBe(true);
      expect(factorFollow!.has('SLASH')).toBe(true);
      expect(factorFollow!.has('PLUS')).toBe(true);
      expect(factorFollow!.has('MINUS')).toBe(true);
    });
    
    it('computes FOLLOW(Atom) includes power operators', () => {
      const first = computeFirst(originalGrammar);
      const follow = computeFollow(originalGrammar, first);
      const atomFollow = follow.get('Atom');
      
      expect(atomFollow).toBeDefined();
      expect(atomFollow!.has('CARET')).toBe(true);
      expect(atomFollow!.has('POWER')).toBe(true);
      expect(atomFollow!.has('STAR')).toBe(true);
      expect(atomFollow!.has('SLASH')).toBe(true);
    });
    
    it('computes FOLLOW(ArgList) = {RPAREN}', () => {
      const first = computeFirst(originalGrammar);
      const follow = computeFollow(originalGrammar, first);
      const argListFollow = follow.get('ArgList');
      
      expect(argListFollow).toBeDefined();
      expect(argListFollow!.has('RPAREN')).toBe(true);
    });
  });
  
  describe('format functions', () => {
    it('formats FIRST sets as sorted arrays', () => {
      const first = computeFirst(originalGrammar);
      const formatted = formatFirst(first);
      
      expect(formatted.Expr).toBeDefined();
      expect(Array.isArray(formatted.Expr)).toBe(true);
      expect(formatted.Expr!.length).toBeGreaterThan(0);
      
      // Check sorting
      const sorted = [...formatted.Expr!].sort();
      expect(formatted.Expr).toEqual(sorted);
    });
    
    it('formats FOLLOW sets as sorted arrays', () => {
      const first = computeFirst(originalGrammar);
      const follow = computeFollow(originalGrammar, first);
      const formatted = formatFollow(follow);
      
      expect(formatted.Expr).toBeDefined();
      expect(Array.isArray(formatted.Expr)).toBe(true);
      
      // Check sorting
      const sorted = [...formatted.Expr!].sort();
      expect(formatted.Expr).toEqual(sorted);
    });
  });
});
