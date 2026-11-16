/**
 * Helper functions for parser visualization
 */

import type { ProgramNode, LineNode, StatementNode, ExprNode, UnitExprNode } from '@/engine/parser/ast';

/**
 * Tree node for visualization
 */
export interface TreeNode {
  name: string;
  children?: TreeNode[];
  value?: string;
}

/**
 * Generate parse tree from AST
 */
export function generateParseTree(ast: ProgramNode): TreeNode {
  const programNode: TreeNode = {
    name: 'Program',
    children: [],
  };

  for (const line of ast.lines) {
    if (line.statement) {
      const lineNode = generateLineTree(line);
      if (lineNode) {
        programNode.children!.push(lineNode);
      }
    }
  }

  return programNode;
}

function generateLineTree(line: LineNode): TreeNode | null {
  if (!line.statement) return null;

  const lineNode: TreeNode = {
    name: 'Line',
    children: [],
  };

  const stmtNode = generateStatementTree(line.statement);
  if (stmtNode) {
    lineNode.children!.push(stmtNode);
  }

  if (line.trailingComment) {
    lineNode.children!.push({
      name: 'Comment',
      value: line.trailingComment,
    });
  }

  return lineNode;
}

function generateStatementTree(stmt: StatementNode): TreeNode | null {
  if (stmt.kind === 'Equation') {
    const eqNode: TreeNode = {
      name: 'Equation',
      children: [],
    };

    // LHS
    const lhsNode: TreeNode = {
      name: 'Lhs',
      children: [
        {
          name: stmt.lhs.kind === 'IdentLhs' ? 'Identifier' : 'Differential',
          value: stmt.lhs.kind === 'IdentLhs' ? stmt.lhs.name : `d${stmt.lhs.variable}/dt`,
        },
      ],
    };
    eqNode.children!.push(lhsNode);

    // Expression
    const exprNode = generateExprTree(stmt.expr);
    if (exprNode) {
      eqNode.children!.push(exprNode);
    }

    // Unit
    const unitNode = generateUnitTree(stmt.unit);
    if (unitNode) {
      eqNode.children!.push(unitNode);
    }

    // Flags
    if (stmt.flags && stmt.flags.length > 0) {
      const flagsNode: TreeNode = {
        name: 'Flags',
        children: stmt.flags.map(f => ({
          name: 'Flag',
          value: f.parts.join('-'),
        })),
      };
      eqNode.children!.push(flagsNode);
    }

    return eqNode;
  } else if (stmt.kind === 'ParamDecl') {
    const paramNode: TreeNode = {
      name: 'ParamDecl',
      children: [
        {
          name: 'Identifier',
          value: stmt.name,
        },
      ],
    };

    const unitNode = generateUnitTree(stmt.unit);
    if (unitNode) {
      paramNode.children!.push(unitNode);
    }

    if (stmt.flags && stmt.flags.length > 0) {
      const flagsNode: TreeNode = {
        name: 'Flags',
        children: stmt.flags.map(f => ({
          name: 'Flag',
          value: f.parts.join('-'),
        })),
      };
      paramNode.children!.push(flagsNode);
    }

    return paramNode;
  }

  return null;
}

function generateExprTree(expr: ExprNode): TreeNode | null {
  if (!expr) return null;

  switch (expr.kind) {
    case 'NumberLiteral':
    case 'BinaryLiteral':
    case 'OctalLiteral':
    case 'HexLiteral':
      return {
        name: expr.kind,
        value: expr.value,
      };

    case 'Identifier':
      return {
        name: 'Identifier',
        value: expr.name,
      };

    case 'BinaryOp':
      return {
        name: `BinaryOp (${expr.op})`,
        children: [
          generateExprTree(expr.left) || { name: 'null' },
          generateExprTree(expr.right) || { name: 'null' },
        ],
      };

    case 'UnaryOp':
      return {
        name: `UnaryOp (${expr.op})`,
        children: [generateExprTree(expr.operand) || { name: 'null' }],
      };

    case 'FunctionCall':
      return {
        name: 'FunctionCall',
        children: [
          { name: 'Function', value: expr.name },
          {
            name: 'Arguments',
            children: expr.args.map(arg => generateExprTree(arg) || { name: 'null' }),
          },
        ],
      };

    case 'ParenExpr':
      return {
        name: 'ParenExpr',
        children: [generateExprTree(expr.expr) || { name: 'null' }],
      };

    default:
      return { name: 'Unknown' };
  }
}

function generateUnitTree(unit: UnitExprNode): TreeNode | null {
  if (!unit) return null;

  switch (unit.kind) {
    case 'UnitIdentifier':
      return {
        name: 'Unit',
        value: unit.name,
      };

    case 'UnitNumber':
      return {
        name: 'UnitNumber',
        value: unit.value,
      };

    case 'UnitBinaryOp':
      return {
        name: `UnitOp (${unit.op})`,
        children: [
          generateUnitTree(unit.left) || { name: 'null' },
          generateUnitTree(unit.right) || { name: 'null' },
        ],
      };

    case 'UnitPower':
      return {
        name: 'UnitPower',
        children: [
          generateUnitTree(unit.base) || { name: 'null' },
          { name: 'Exponent', value: unit.exponent.toString() },
        ],
      };

    case 'UnitParen':
      return {
        name: 'UnitParen',
        children: [generateUnitTree(unit.unit) || { name: 'null' }],
      };

    default:
      return { name: 'Unknown' };
  }
}

/**
 * Generate leftmost derivation for a simple expression
 * This is a simplified version showing the derivation steps
 */
export function generateDerivation(ast: ProgramNode): string[] {
  const steps: string[] = [];
  
  // Start symbol
  steps.push('Program');

  for (let i = 0; i < ast.lines.length; i++) {
    const line = ast.lines[i];
    if (!line || !line.statement) continue;
    
    if (i === 0) {
      steps.push('Program → Line');
      steps.push('Line → Statement');
    } else {
      steps.push(`Program → Program NEWLINE Line`);
      steps.push('Line → Statement');
    }

    const stmt = line.statement;
    if (stmt.kind === 'Equation') {
      steps.push('Statement → Equation');
      steps.push('Equation → Lhs = Expr : UnitExpr Flags');

      // Add the actual expansion
      const lhsStr = stmt.lhs.kind === 'IdentLhs' ? stmt.lhs.name : `d${stmt.lhs.variable}/dt`;
      const exprStr = stringifyExpr(stmt.expr);
      const unitStr = stringifyUnit(stmt.unit);
      const flagsStr = stmt.flags && stmt.flags.length > 0 
        ? ` (${stmt.flags.map(f => f.parts.join('-')).join(', ')})`
        : '';
      
      steps.push(`${lhsStr} = ${exprStr} : ${unitStr}${flagsStr}`);
    } else if (stmt.kind === 'ParamDecl') {
      steps.push('Statement → ParamDecl');
      steps.push('ParamDecl → IDENT : UnitExpr Flags');

      const unitStr = stringifyUnit(stmt.unit);
      const flagsStr = stmt.flags && stmt.flags.length > 0
        ? ` (${stmt.flags.map(f => f.parts.join('-')).join(', ')})`
        : '';
      
      steps.push(`${stmt.name} : ${unitStr}${flagsStr}`);
    }
  }

  return steps;
}

function stringifyExpr(expr: ExprNode): string {
  switch (expr.kind) {
    case 'NumberLiteral':
    case 'BinaryLiteral':
    case 'OctalLiteral':
    case 'HexLiteral':
      return expr.value;

    case 'Identifier':
      return expr.name;

    case 'BinaryOp':
      const leftStr = stringifyExpr(expr.left);
      const rightStr = stringifyExpr(expr.right);
      return `(${leftStr} ${expr.op} ${rightStr})`;

    case 'UnaryOp':
      return `${expr.op}${stringifyExpr(expr.operand)}`;

    case 'FunctionCall':
      const argsStr = expr.args.map(a => stringifyExpr(a)).join(', ');
      return `${expr.name}(${argsStr})`;

    case 'ParenExpr':
      return `(${stringifyExpr(expr.expr)})`;

    default:
      return '?';
  }
}

function stringifyUnit(unit: UnitExprNode): string {
  switch (unit.kind) {
    case 'UnitIdentifier':
      return unit.name;

    case 'UnitNumber':
      return unit.value;

    case 'UnitBinaryOp':
      const leftStr = stringifyUnit(unit.left);
      const rightStr = stringifyUnit(unit.right);
      return `${leftStr} ${unit.op} ${rightStr}`;

    case 'UnitPower':
      const baseStr = stringifyUnit(unit.base);
      return `${baseStr}^${unit.exponent}`;

    case 'UnitParen':
      return `(${stringifyUnit(unit.unit)})`;

    default:
      return '?';
  }
}

/**
 * Extract annotations from AST
 */
export interface Annotation {
  type: 'trailing' | 'standalone';
  line: number;
  comment: string;
  attachedTo?: string; // For trailing comments, what statement they're attached to
}

export function extractAnnotations(ast: ProgramNode, sourceLines: string[]): Annotation[] {
  const annotations: Annotation[] = [];

  for (let i = 0; i < ast.lines.length; i++) {
    const line = ast.lines[i];
    if (!line) continue;
    
    const lineNum = i + 1;

    if (line.trailingComment) {
      let attachedTo = 'Line';
      if (line.statement) {
        if (line.statement.kind === 'Equation') {
          const lhs = line.statement.lhs;
          attachedTo = lhs.kind === 'IdentLhs' ? lhs.name : `d${lhs.variable}/dt`;
        } else if (line.statement.kind === 'ParamDecl') {
          attachedTo = line.statement.name;
        }
      }

      annotations.push({
        type: 'trailing',
        line: lineNum,
        comment: line.trailingComment,
        attachedTo,
      });
    } else if (!line.statement) {
      // Check for standalone comment
      const sourceLine = sourceLines[i];
      if (sourceLine && sourceLine.trim().startsWith('#')) {
        annotations.push({
          type: 'standalone',
          line: lineNum,
          comment: sourceLine.trim().slice(1).trim(),
        });
      }
    }
  }

  return annotations;
}

/**
 * Render tree as nested divs (simple visualization)
 */
export function renderTreeAsText(node: TreeNode, indent: number = 0): string {
  const prefix = '  '.repeat(indent);
  let result = `${prefix}${node.name}`;
  
  if (node.value) {
    result += `: ${node.value}`;
  }
  
  result += '\n';

  if (node.children) {
    for (const child of node.children) {
      result += renderTreeAsText(child, indent + 1);
    }
  }

  return result;
}
