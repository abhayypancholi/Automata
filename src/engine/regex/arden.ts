/**
 * Arden's theorem: Convert finite automaton to regular expression
 * 
 * Algorithm: Arden's lemma (State elimination method)
 * 
 * Convention: Right-linear equations (per design 6.5)
 * For each state q: X_q = (Σ over transitions q -a-> p of a·X_p) | (ε if q accepting)
 * This means "read the symbol, then continue from the next state"
 * 
 * Solving: For equation X = A·X | B where A is self-loop, apply Arden's rule: X = A*·B
 * Note: When ε ∈ L(A), the equation has multiple solutions; A*·B gives the least solution.
 * 
 * Simplification identities (R6.2):
 * - ∅·r = r·∅ = ∅ (empty is absorbing for concat)
 * - ε·r = r·ε = r (epsilon is identity for concat)
 * - ∅|r = r|∅ = r (empty is identity for union)
 * - ε* = ε
 * - ∅* = ε
 * - r|r = r (idempotent union)
 */

import type { Automaton, StateId } from '../automaton/types';
import type { Result } from '../errors';
import type { Trace, TraceStep } from '../trace';
import { normalize } from '../automaton/normalize';

/**
 * Regex expression (internal representation for Arden)
 */
type RegexExpr =
  | { type: 'empty' } // ∅
  | { type: 'epsilon' } // ε
  | { type: 'symbol'; value: string } // literal
  | { type: 'concat'; left: RegexExpr; right: RegexExpr } // r·s
  | { type: 'union'; left: RegexExpr; right: RegexExpr } // r|s
  | { type: 'star'; child: RegexExpr } // r*
  | { type: 'variable'; name: string }; // X_q

interface ArdenTraceData {
  kind: 'arden';
  step: 'initial' | 'reachability' | 'substitute' | 'arden' | 'simplify' | 'final';
  equations?: Record<string, string>;
  eliminated?: string;
  substitution?: { from: string; into: string; result: string };
  identityApplied?: string;
  description: string;
}

// Helper constructors
const empty = (): RegexExpr => ({ type: 'empty' });
const epsilon = (): RegexExpr => ({ type: 'epsilon' });
const symbol = (value: string): RegexExpr => ({ type: 'symbol', value });
const variable = (name: string): RegexExpr => ({ type: 'variable', name });
const concat = (left: RegexExpr, right: RegexExpr): RegexExpr => ({ type: 'concat', left, right });
const union = (left: RegexExpr, right: RegexExpr): RegexExpr => ({ type: 'union', left, right });
const star = (child: RegexExpr): RegexExpr => ({ type: 'star', child });

/**
 * Convert regex expression to string (canonical form with |)
 */
function exprToString(expr: RegexExpr): string {
  switch (expr.type) {
    case 'empty':
      return '∅';
    case 'epsilon':
      return 'ε';
    case 'symbol':
      return expr.value;
    case 'variable':
      return expr.name;
    case 'concat': {
      const left = exprToString(expr.left);
      const right = exprToString(expr.right);
      const leftNeedsParen = expr.left.type === 'union';
      const rightNeedsParen = expr.right.type === 'union';
      return `${leftNeedsParen ? `(${left})` : left}${rightNeedsParen ? `(${right})` : right}`;
    }
    case 'union': {
      const left = exprToString(expr.left);
      const right = exprToString(expr.right);
      return `${left}|${right}`;
    }
    case 'star': {
      const child = exprToString(expr.child);
      const needsParen = expr.child.type !== 'symbol' && expr.child.type !== 'epsilon' && expr.child.type !== 'variable';
      return `${needsParen ? `(${child})` : child}*`;
    }
  }
}

/**
 * Apply simplification identities
 */
function simplify(expr: RegexExpr): { result: RegexExpr; applied: string[] } {
  const identities: string[] = [];
  
  function simplifyOnce(e: RegexExpr): RegexExpr {
    switch (e.type) {
      case 'concat': {
        const left = simplifyOnce(e.left);
        const right = simplifyOnce(e.right);
        
        // ∅·r = ∅
        if (left.type === 'empty') {
          identities.push('∅·r = ∅');
          return empty();
        }
        // r·∅ = ∅
        if (right.type === 'empty') {
          identities.push('r·∅ = ∅');
          return empty();
        }
        // ε·r = r
        if (left.type === 'epsilon') {
          identities.push('ε·r = r');
          return right;
        }
        // r·ε = r
        if (right.type === 'epsilon') {
          identities.push('r·ε = r');
          return left;
        }
        
        return concat(left, right);
      }
      
      case 'union': {
        const left = simplifyOnce(e.left);
        const right = simplifyOnce(e.right);
        
        // ∅|r = r
        if (left.type === 'empty') {
          identities.push('∅|r = r');
          return right;
        }
        // r|∅ = r
        if (right.type === 'empty') {
          identities.push('r|∅ = r');
          return left;
        }
        // r|r = r
        if (exprToString(left) === exprToString(right)) {
          identities.push('r|r = r');
          return left;
        }
        
        return union(left, right);
      }
      
      case 'star': {
        const child = simplifyOnce(e.child);
        
        // ε* = ε
        if (child.type === 'epsilon') {
          identities.push('ε* = ε');
          return epsilon();
        }
        // ∅* = ε
        if (child.type === 'empty') {
          identities.push('∅* = ε');
          return epsilon();
        }
        
        return star(child);
      }
      
      default:
        return e;
    }
  }
  
  // Apply simplifications repeatedly until no more changes
  let current = expr;
  let prev: string;
  let iterations = 0;
  const maxIterations = 100;
  
  do {
    prev = exprToString(current);
    current = simplifyOnce(current);
    iterations++;
  } while (exprToString(current) !== prev && iterations < maxIterations);
  
  return { result: current, applied: identities };
}

/**
 * Find reachable states from start
 */
function findReachableStates(automaton: Automaton): Set<StateId> {
  const reachable = new Set<StateId>();
  const queue = [automaton.start];
  reachable.add(automaton.start);
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    
    for (const transition of automaton.transitions) {
      if (transition.from === current && !reachable.has(transition.to)) {
        reachable.add(transition.to);
        queue.push(transition.to);
      }
    }
  }
  
  return reachable;
}

/**
 * Substitute variable in expression
 */
function substituteVariable(expr: RegexExpr, varName: string, replacement: RegexExpr): RegexExpr {
  switch (expr.type) {
    case 'variable':
      return expr.name === varName ? replacement : expr;
    case 'concat':
      return concat(
        substituteVariable(expr.left, varName, replacement),
        substituteVariable(expr.right, varName, replacement)
      );
    case 'union':
      return union(
        substituteVariable(expr.left, varName, replacement),
        substituteVariable(expr.right, varName, replacement)
      );
    case 'star':
      return star(substituteVariable(expr.child, varName, replacement));
    default:
      return expr;
  }
}

/**
 * Convert automaton to regular expression using Arden's method
 */
export function arden(automaton: Automaton): Result<{
  regex: string;
  regexTextbook: string;
  trace: Trace<ArdenTraceData>;
}> {
  const normalized = normalize(automaton);
  const steps: TraceStep<ArdenTraceData>[] = [];
  
  // Step 1: Remove unreachable states
  const reachable = findReachableStates(normalized);
  const states = normalized.states.filter(s => reachable.has(s));
  
  if (states.length < normalized.states.length) {
    steps.push({
      index: steps.length,
      title: 'Remove Unreachable States',
      explanation: `Removed ${normalized.states.length - states.length} unreachable state(s). They contribute nothing to the language.`,
      data: {
        kind: 'arden',
        step: 'reachability',
        description: `Reachable states: {${Array.from(states).join(', ')}}`,
      },
    });
  }
  
  // Step 2: Build initial equation system
  // X_q = (Σ over transitions q -a-> p of a·X_p) | (ε if q accepting)
  const equations = new Map<StateId, RegexExpr>();
  
  for (const state of states) {
    const terms: RegexExpr[] = [];
    
    // Add transitions
    for (const transition of normalized.transitions) {
      if (transition.from === state && reachable.has(transition.to)) {
        terms.push(concat(symbol(transition.symbol), variable(`X_${transition.to}`)));
      }
    }
    
    // Add ε if accepting
    if (normalized.accepting.includes(state)) {
      terms.push(epsilon());
    }
    
    // Combine with union
    let expr: RegexExpr = terms.length === 0 ? empty() : terms[0]!;
    for (let i = 1; i < terms.length; i++) {
      expr = union(expr, terms[i]!);
    }
    
    equations.set(state, expr);
  }
  
  const equationStrings: Record<string, string> = {};
  for (const [state, expr] of equations) {
    equationStrings[`X_${state}`] = exprToString(expr);
  }
  
  steps.push({
    index: steps.length,
    title: 'Initial Equations',
    explanation: 'Built right-linear equations: X_q = (symbols and next states) | (ε if accepting)',
    data: {
      kind: 'arden',
      step: 'initial',
      equations: equationStrings,
      description: `Created ${states.length} equation(s)`,
    },
  });
  
  // Step 3: Eliminate variables one by one (except start)
  const stateOrder = states.filter(s => s !== normalized.start);
  
  for (const elimState of stateOrder) {
    const elimVar = `X_${elimState}`;
    const elimExpr = equations.get(elimState)!;
    
    // Separate self-loop (A) from rest (B)
    // X = A·X | B  =>  X = A*·B
    const selfLoopTerms: RegexExpr[] = [];
    const otherTerms: RegexExpr[] = [];
    
    function collectTerms(e: RegexExpr, terms: RegexExpr[]): void {
      if (e.type === 'union') {
        collectTerms(e.left, terms);
        collectTerms(e.right, terms);
      } else {
        terms.push(e);
      }
    }
    
    const allTerms: RegexExpr[] = [];
    collectTerms(elimExpr, allTerms);
    
    for (const term of allTerms) {
      if (term.type === 'concat' && term.right.type === 'variable' && term.right.name === elimVar) {
        selfLoopTerms.push(term.left);
      } else {
        otherTerms.push(term);
      }
    }
    
    // Build A and B
    let A: RegexExpr = selfLoopTerms.length === 0 ? empty() : selfLoopTerms[0]!;
    for (let i = 1; i < selfLoopTerms.length; i++) {
      A = union(A, selfLoopTerms[i]!);
    }
    
    let B: RegexExpr = otherTerms.length === 0 ? empty() : otherTerms[0]!;
    for (let i = 1; i < otherTerms.length; i++) {
      B = union(B, otherTerms[i]!);
    }
    
    // Apply Arden: X = A*·B
    const solution = A.type === 'empty' ? B : concat(star(A), B);
    const simplifiedSolution = simplify(solution);
    
    steps.push({
      index: steps.length,
      title: `Arden's Rule: ${elimVar}`,
      explanation: `Applied Arden's rule: ${elimVar} = ${A.type === 'empty' ? 'B' : 'A*·B'}`,
      data: {
        kind: 'arden',
        step: 'arden',
        eliminated: elimVar,
        description: `A = ${exprToString(A)}, B = ${exprToString(B)} => ${elimVar} = ${exprToString(simplifiedSolution.result)}`,
      },
    });
    
    if (simplifiedSolution.applied.length > 0) {
      steps.push({
        index: steps.length,
        title: 'Simplify',
        explanation: `Applied ${simplifiedSolution.applied.length} identit${simplifiedSolution.applied.length === 1 ? 'y' : 'ies'}`,
        data: {
          kind: 'arden',
          step: 'simplify',
          identityApplied: simplifiedSolution.applied.join(', '),
          description: `Simplified ${elimVar}`,
        },
      });
    }
    
    // Substitute into remaining equations
    for (const [state, expr] of equations) {
      if (state !== elimState) {
        const substituted = substituteVariable(expr, elimVar, simplifiedSolution.result);
        const simplified = simplify(substituted);
        equations.set(state, simplified.result);
      }
    }
    
    equations.delete(elimState);
  }
  
  // Step 4: Process start state with Arden's rule if it has self-loops
  const startExpr = equations.get(normalized.start) || empty();
  
  // Separate self-loop (A) from rest (B) for start state
  const startSelfLoopTerms: RegexExpr[] = [];
  const startOtherTerms: RegexExpr[] = [];
  
  function collectTerms(e: RegexExpr, terms: RegexExpr[]): void {
    if (e.type === 'union') {
      collectTerms(e.left, terms);
      collectTerms(e.right, terms);
    } else {
      terms.push(e);
    }
  }
  
  const startAllTerms: RegexExpr[] = [];
  collectTerms(startExpr, startAllTerms);
  
  const startVar = `X_${normalized.start}`;
  for (const term of startAllTerms) {
    if (term.type === 'concat' && term.right.type === 'variable' && term.right.name === startVar) {
      startSelfLoopTerms.push(term.left);
    } else {
      startOtherTerms.push(term);
    }
  }
  
  // Build A and B for start state
  let startA: RegexExpr = startSelfLoopTerms.length === 0 ? empty() : startSelfLoopTerms[0]!;
  for (let i = 1; i < startSelfLoopTerms.length; i++) {
    startA = union(startA, startSelfLoopTerms[i]!);
  }
  
  let startB: RegexExpr = startOtherTerms.length === 0 ? empty() : startOtherTerms[0]!;
  for (let i = 1; i < startOtherTerms.length; i++) {
    startB = union(startB, startOtherTerms[i]!);
  }
  
  // Apply Arden if there are self-loops
  let finalExpr: RegexExpr;
  if (startA.type !== 'empty') {
    finalExpr = concat(star(startA), startB);
    
    steps.push({
      index: steps.length,
      title: `Arden's Rule: ${startVar}`,
      explanation: `Applied Arden's rule to start state: ${startVar} = A*·B`,
      data: {
        kind: 'arden',
        step: 'arden',
        eliminated: startVar,
        description: `A = ${exprToString(startA)}, B = ${exprToString(startB)} => ${startVar} = ${exprToString(finalExpr)}`,
      },
    });
  } else {
    finalExpr = startB;
  }
  
  const finalSimplified = simplify(finalExpr);
  
  steps.push({
    index: steps.length,
    title: 'Final Regular Expression',
    explanation: `The regular expression for the start state X_${normalized.start} is the language of the automaton.`,
    data: {
      kind: 'arden',
      step: 'final',
      description: `Result: ${exprToString(finalSimplified.result)}`,
    },
  });
  
  const regex = exprToString(finalSimplified.result);
  const regexTextbook = regex.replace(/\|/g, '+'); // Use + for union in textbook notation
  
  return {
    ok: true,
    value: {
      regex,
      regexTextbook,
      trace: { steps },
    },
  };
}
