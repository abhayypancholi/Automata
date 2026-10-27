/**
 * AST node types for the mini-language
 */

/**
 * Base AST node
 */
export interface ASTNode {
  kind: string;
  line: number;
  column: number;
}

/**
 * Program: sequence of lines
 */
export interface ProgramNode extends ASTNode {
  kind: 'Program';
  lines: LineNode[];
}

/**
 * Line: statement with optional comment
 */
export interface LineNode extends ASTNode {
  kind: 'Line';
  statement: StatementNode | null;
  trailingComment?: string;
  leadingComments?: string[];
}

/**
 * Statement: equation or parameter declaration
 */
export type StatementNode = EquationNode | ParamDeclNode;

/**
 * Equation: lhs = expr : unit flags
 */
export interface EquationNode extends ASTNode {
  kind: 'Equation';
  lhs: LhsNode;
  expr: ExprNode;
  unit: UnitExprNode;
  flags: FlagNode[];
}

/**
 * Parameter declaration: ident : unit flags
 */
export interface ParamDeclNode extends ASTNode {
  kind: 'ParamDecl';
  name: string;
  unit: UnitExprNode;
  flags: FlagNode[];
}

/**
 * Left-hand side: IDENT or DIFF (dv/dt)
 */
export type LhsNode = IdentLhsNode | DiffLhsNode;

export interface IdentLhsNode extends ASTNode {
  kind: 'IdentLhs';
  name: string;
}

export interface DiffLhsNode extends ASTNode {
  kind: 'DiffLhs';
  variable: string;  // The variable name from dv/dt
}

/**
 * Flag: single ident or hyphenated (clock-driven)
 */
export interface FlagNode extends ASTNode {
  kind: 'Flag';
  parts: string[];  // ['clock', 'driven'] for clock-driven
}

/**
 * Expression nodes
 */
export type ExprNode =
  | BinaryOpNode
  | UnaryOpNode
  | NumberLiteralNode
  | BinaryLiteralNode
  | OctalLiteralNode
  | HexLiteralNode
  | IdentifierNode
  | FunctionCallNode
  | ParenExprNode;

export interface BinaryOpNode extends ASTNode {
  kind: 'BinaryOp';
  op: '+' | '-' | '*' | '/' | '^' | '**';
  left: ExprNode;
  right: ExprNode;
}

export interface UnaryOpNode extends ASTNode {
  kind: 'UnaryOp';
  op: '+' | '-';
  operand: ExprNode;
}

export interface NumberLiteralNode extends ASTNode {
  kind: 'NumberLiteral';
  value: string;
}

export interface BinaryLiteralNode extends ASTNode {
  kind: 'BinaryLiteral';
  value: string;
}

export interface OctalLiteralNode extends ASTNode {
  kind: 'OctalLiteral';
  value: string;
}

export interface HexLiteralNode extends ASTNode {
  kind: 'HexLiteral';
  value: string;
}

export interface IdentifierNode extends ASTNode {
  kind: 'Identifier';
  name: string;
}

export interface FunctionCallNode extends ASTNode {
  kind: 'FunctionCall';
  name: string;
  args: ExprNode[];
}

export interface ParenExprNode extends ASTNode {
  kind: 'ParenExpr';
  expr: ExprNode;
}

/**
 * Unit expression nodes
 */
export type UnitExprNode =
  | UnitBinaryOpNode
  | UnitPowerNode
  | UnitIdentifierNode
  | UnitNumberNode
  | UnitParenNode;

export interface UnitBinaryOpNode extends ASTNode {
  kind: 'UnitBinaryOp';
  op: '*' | '/';
  left: UnitExprNode;
  right: UnitExprNode;
}

export interface UnitPowerNode extends ASTNode {
  kind: 'UnitPower';
  base: UnitExprNode;
  exponent: number;  // Must be integer, can be negative
}

export interface UnitIdentifierNode extends ASTNode {
  kind: 'UnitIdentifier';
  name: string;
}

export interface UnitNumberNode extends ASTNode {
  kind: 'UnitNumber';
  value: string;  // Should be "1" for dimensionless
}

export interface UnitParenNode extends ASTNode {
  kind: 'UnitParen';
  unit: UnitExprNode;
}

/**
 * Pretty-print AST to source code (for round-trip oracle testing)
 */
export function prettyPrint(node: ASTNode): string {
  switch (node.kind) {
    case 'Program':
      return (node as ProgramNode).lines
        .map(line => prettyPrint(line))
        .join('\n');
    
    case 'Line': {
      const line = node as LineNode;
      if (!line.statement) {
        return line.trailingComment ? `# ${line.trailingComment}` : '';
      }
      let result = prettyPrint(line.statement);
      if (line.trailingComment) {
        result += ` # ${line.trailingComment}`;
      }
      return result;
    }
    
    case 'Equation': {
      const eq = node as EquationNode;
      let result = `${prettyPrint(eq.lhs)} = ${prettyPrint(eq.expr)} : ${prettyPrint(eq.unit)}`;
      if (eq.flags.length > 0) {
        result += ' (' + eq.flags.map(f => prettyPrint(f)).join(', ') + ')';
      }
      return result;
    }
    
    case 'ParamDecl': {
      const param = node as ParamDeclNode;
      let result = `${param.name} : ${prettyPrint(param.unit)}`;
      if (param.flags.length > 0) {
        result += ' (' + param.flags.map(f => prettyPrint(f)).join(', ') + ')';
      }
      return result;
    }
    
    case 'IdentLhs':
      return (node as IdentLhsNode).name;
    
    case 'DiffLhs':
      return `d${(node as DiffLhsNode).variable}/dt`;
    
    case 'Flag':
      return (node as FlagNode).parts.join('-');
    
    case 'BinaryOp': {
      const bin = node as BinaryOpNode;
      return `${prettyPrint(bin.left)} ${bin.op} ${prettyPrint(bin.right)}`;
    }
    
    case 'UnaryOp': {
      const un = node as UnaryOpNode;
      return `${un.op}${prettyPrint(un.operand)}`;
    }
    
    case 'NumberLiteral':
      return (node as NumberLiteralNode).value;
    
    case 'BinaryLiteral':
      return (node as BinaryLiteralNode).value;
    
    case 'OctalLiteral':
      return (node as OctalLiteralNode).value;
    
    case 'HexLiteral':
      return (node as HexLiteralNode).value;
    
    case 'Identifier':
      return (node as IdentifierNode).name;
    
    case 'FunctionCall': {
      const fn = node as FunctionCallNode;
      return `${fn.name}(${fn.args.map(a => prettyPrint(a)).join(', ')})`;
    }
    
    case 'ParenExpr':
      return `(${prettyPrint((node as ParenExprNode).expr)})`;
    
    case 'UnitBinaryOp': {
      const bin = node as UnitBinaryOpNode;
      return `${prettyPrint(bin.left)} ${bin.op} ${prettyPrint(bin.right)}`;
    }
    
    case 'UnitPower': {
      const pow = node as UnitPowerNode;
      return `${prettyPrint(pow.base)}^${pow.exponent}`;
    }
    
    case 'UnitIdentifier':
      return (node as UnitIdentifierNode).name;
    
    case 'UnitNumber':
      return (node as UnitNumberNode).value;
    
    case 'UnitParen':
      return `(${prettyPrint((node as UnitParenNode).unit)})`;
    
    default:
      return '<unknown>';
  }
}
