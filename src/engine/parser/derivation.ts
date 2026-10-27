/**
 * Leftmost derivation generation from parse tree
 * 
 * Algorithm: Traverse the parse tree and expand the leftmost nonterminal
 * at each step, using the original grammar productions.
 * 
 * The derivation shows how the start symbol derives the input string
 * through a sequence of production applications.
 */

import type { ProgramNode, ExprNode, BinaryOpNode } from './ast';

export interface DerivationStep {
  sententialForm: string;
  production: string;
  explanation: string;
}

/**
 * Generate leftmost derivation for an equation
 * 
 * Simplified version - shows the key production steps
 * Full implementation would track all intermediate sentential forms
 */
export function leftmostDerivation(ast: ProgramNode): DerivationStep[] {
  const steps: DerivationStep[] = [];
  
  // Start symbol
  steps.push({
    sententialForm: 'Program',
    production: 'Start',
    explanation: 'Begin with start symbol Program',
  });
  
  // For each line with a statement
  for (let i = 0; i < ast.lines.length; i++) {
    const line = ast.lines[i];
    if (!line?.statement) continue;
    
    const stmt = line.statement;
    
    if (stmt.kind === 'Equation') {
      steps.push({
        sententialForm: 'Line → Statement → Equation',
        production: 'Equation → Lhs = Expr : UnitExpr Flags',
        explanation: `Derive equation on line ${i + 1}`,
      });
      
      // Show expression derivation
      deriveExpr(stmt.expr, steps);
    } else if (stmt.kind === 'ParamDecl') {
      steps.push({
        sententialForm: 'Line → Statement → ParamDecl',
        production: 'ParamDecl → IDENT : UnitExpr Flags',
        explanation: `Derive parameter declaration on line ${i + 1}`,
      });
    }
  }
  
  return steps;
}

/**
 * Derive expression productions
 */
function deriveExpr(expr: ExprNode, steps: DerivationStep[]): void {
  if (expr.kind === 'BinaryOp') {
    const binOp = expr as BinaryOpNode;
    
    // Determine which nonterminal based on operator
    let nonTerminal = '';
    let production = '';
    
    if (binOp.op === '+' || binOp.op === '-') {
      nonTerminal = 'Expr';
      production = `Expr → Expr ${binOp.op} Term`;
    } else if (binOp.op === '*' || binOp.op === '/') {
      nonTerminal = 'Term';
      production = `Term → Term ${binOp.op} Factor`;
    } else if (binOp.op === '^' || binOp.op === '**') {
      nonTerminal = 'Power';
      production = `Power → Atom ${binOp.op} Factor`;
    }
    
    steps.push({
      sententialForm: nonTerminal,
      production,
      explanation: `Apply ${binOp.op} operator`,
    });
    
    // Recursively derive operands
    deriveExpr(binOp.left, steps);
    deriveExpr(binOp.right, steps);
  } else if (expr.kind === 'UnaryOp') {
    steps.push({
      sententialForm: 'Factor',
      production: `Factor → ${expr.op} Factor`,
      explanation: `Apply unary ${expr.op}`,
    });
  } else if (expr.kind === 'NumberLiteral') {
    steps.push({
      sententialForm: 'Atom',
      production: 'Atom → NUMBER',
      explanation: 'Derive number literal',
    });
  } else if (expr.kind === 'Identifier') {
    steps.push({
      sententialForm: 'Atom',
      production: 'Atom → IDENT',
      explanation: 'Derive identifier',
    });
  } else if (expr.kind === 'FunctionCall') {
    steps.push({
      sententialForm: 'Atom',
      production: 'Atom → IDENT ( ArgList )',
      explanation: 'Derive function call',
    });
  } else if (expr.kind === 'ParenExpr') {
    steps.push({
      sententialForm: 'Atom',
      production: 'Atom → ( Expr )',
      explanation: 'Derive parenthesized expression',
    });
    deriveExpr(expr.expr, steps);
  }
}
