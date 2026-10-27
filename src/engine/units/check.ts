/**
 * Unit checker for the mini-language
 * 
 * Two-pass algorithm:
 * 1. Collect declarations and check for reserved names
 * 2. Type-check expressions, computing dimensions
 */

import type { ProgramNode, ExprNode, UnitExprNode } from '../parser/ast';
import type { Dimension } from './dimension';
import type { EngineError, Result } from '../errors';
import { lookupUnit, isReservedUnit } from './unitTable';
import {
  DIMENSIONLESS, equal, isDimensionless, mul, div, pow as dimPow, format, nameOf
} from './dimension';

/**
 * Variable environment: maps variable names to dimensions
 */
type Environment = Map<string, Dimension>;

/**
 * Known functions with their type signatures
 */
const KNOWN_FUNCTIONS: Record<string, {
  arity: number;
  argDimension: Dimension;
  returnDimension: (argDim: Dimension) => Dimension;
}> = {
  'exp': { arity: 1, argDimension: DIMENSIONLESS, returnDimension: () => DIMENSIONLESS },
  'log': { arity: 1, argDimension: DIMENSIONLESS, returnDimension: () => DIMENSIONLESS },
  'sin': { arity: 1, argDimension: DIMENSIONLESS, returnDimension: () => DIMENSIONLESS },
  'cos': { arity: 1, argDimension: DIMENSIONLESS, returnDimension: () => DIMENSIONLESS },
  'tan': { arity: 1, argDimension: DIMENSIONLESS, returnDimension: () => DIMENSIONLESS },
  'tanh': { arity: 1, argDimension: DIMENSIONLESS, returnDimension: () => DIMENSIONLESS },
  'abs': { arity: 1, argDimension: DIMENSIONLESS, returnDimension: (d) => d },  // Preserves dimension
};

/**
 * Check result
 */
export interface CheckResult {
  ok: boolean;
  errors: EngineError[];
}

/**
 * Check a program for unit consistency
 */
export function checkProgram(ast: ProgramNode): Result<CheckResult> {
  const errors: EngineError[] = [];
  const env: Environment = new Map();
  
  // Pass 1: Collect ALL declarations (to support forward references)
  for (const line of ast.lines) {
    if (!line.statement) continue;
    
    const stmt = line.statement;
    
    if (stmt.kind === 'ParamDecl') {
      // Check for reserved name
      if (isReservedUnit(stmt.name)) {
        errors.push({
          code: 'RESERVED_NAME',
          message: `Variable name '${stmt.name}' is a reserved unit name`,
          line: stmt.line,
          column: stmt.column,
        });
        continue;
      }
      
      // Check for duplicate
      if (env.has(stmt.name)) {
        errors.push({
          code: 'UNDECLARED_IDENTIFIER',
          message: `Duplicate declaration of '${stmt.name}'`,
          line: stmt.line,
          column: stmt.column,
        });
        continue;
      }
      
      // Parse unit expression
      const unitDim = parseUnitExpr(stmt.unit);
      if (!unitDim.ok) {
        errors.push(unitDim.error);
        continue;
      }
      
      env.set(stmt.name, unitDim.value);
    } else if (stmt.kind === 'Equation') {
      // Extract variable name
      let varName: string;
      
      if (stmt.lhs.kind === 'IdentLhs') {
        varName = stmt.lhs.name;
      } else {
        varName = stmt.lhs.variable;
      }
      
      // Check for reserved name
      if (isReservedUnit(varName)) {
        errors.push({
          code: 'RESERVED_NAME',
          message: `Variable name '${varName}' is a reserved unit name`,
          line: stmt.lhs.line,
          column: stmt.lhs.column,
        });
        continue;
      }
      
      // Check for duplicate
      if (env.has(varName)) {
        errors.push({
          code: 'UNDECLARED_IDENTIFIER',
          message: `Duplicate declaration of '${varName}'`,
          line: stmt.lhs.line,
          column: stmt.lhs.column,
        });
        continue;
      }
      
      // Parse declared unit (but don't type-check RHS yet)
      const unitDim = parseUnitExpr(stmt.unit);
      if (!unitDim.ok) {
        errors.push(unitDim.error);
        continue;
      }
      
      // For differential equations, the variable has dimension unit, not unit/time
      // (The RHS has dimension unit/time)
      const varDim = unitDim.value;
      env.set(varName, varDim);
    }
  }
  
  // Pass 2: Type-check equations
  for (const line of ast.lines) {
    if (!line.statement) continue;
    
    const stmt = line.statement;
    
    if (stmt.kind === 'Equation') {
      // Check RHS expression
      const exprDim = checkExpr(stmt.expr, env);
      if (!exprDim.ok) {
        errors.push(exprDim.error);
        continue;
      }
      
      // Parse declared unit
      const unitDim = parseUnitExpr(stmt.unit);
      if (!unitDim.ok) {
        errors.push(unitDim.error);
        continue;
      }
      
      // For differential equations, RHS dimension should be unit/time
      // For regular equations, RHS dimension should be unit
      const expectedDim = stmt.lhs.kind === 'DiffLhs' 
        ? div(unitDim.value, [0, 0, 1, 0, 0, 0, 0])
        : unitDim.value;
      
      // Check match
      if (!equal(exprDim.value, expectedDim)) {
        const exprName = nameOf(exprDim.value) ?? format(exprDim.value);
        const expectedName = nameOf(expectedDim) ?? format(expectedDim);
        
        errors.push({
          code: 'UNIT_MISMATCH',
          message: `Unit mismatch: expression has dimension ${exprName}, but expected ${expectedName}`,
          line: stmt.line,
          column: stmt.column,
        });
      }
    }
  }
  
  if (errors.length > 0) {
    return { ok: false, error: errors[0]! };
  }
  
  return {
    ok: true,
    value: { ok: true, errors: [] },
  };
}

/**
 * Parse a unit expression into a dimension
 */
function parseUnitExpr(unit: UnitExprNode): Result<Dimension> {
  switch (unit.kind) {
    case 'UnitIdentifier': {
      const dim = lookupUnit(unit.name);
      if (!dim) {
        return {
          ok: false,
          error: {
            code: 'UNKNOWN_UNIT',
            message: `Unknown unit '${unit.name}'`,
            line: unit.line,
            column: unit.column,
          },
        };
      }
      return { ok: true, value: dim };
    }
    
    case 'UnitNumber':
      // Should be "1" for dimensionless
      return { ok: true, value: DIMENSIONLESS };
    
    case 'UnitBinaryOp': {
      const left = parseUnitExpr(unit.left);
      if (!left.ok) return left;
      
      const right = parseUnitExpr(unit.right);
      if (!right.ok) return right;
      
      const result = unit.op === '*' ? mul(left.value, right.value) : div(left.value, right.value);
      return { ok: true, value: result };
    }
    
    case 'UnitPower': {
      const base = parseUnitExpr(unit.base);
      if (!base.ok) return base;
      
      return { ok: true, value: dimPow(base.value, unit.exponent) };
    }
    
    case 'UnitParen':
      return parseUnitExpr(unit.unit);
  }
}

/**
 * Check an expression and compute its dimension
 */
function checkExpr(expr: ExprNode, env: Environment): Result<Dimension> {
  switch (expr.kind) {
    case 'NumberLiteral':
    case 'BinaryLiteral':
    case 'OctalLiteral':
    case 'HexLiteral':
      return { ok: true, value: DIMENSIONLESS };
    
    case 'Identifier': {
      const dim = env.get(expr.name);
      if (!dim) {
        return {
          ok: false,
          error: {
            code: 'UNDECLARED_IDENTIFIER',
            message: `Undeclared identifier '${expr.name}'`,
            line: expr.line,
            column: expr.column,
          },
        };
      }
      return { ok: true, value: dim };
    }
    
    case 'BinaryOp': {
      const left = checkExpr(expr.left, env);
      if (!left.ok) return left;
      
      const right = checkExpr(expr.right, env);
      if (!right.ok) return right;
      
      if (expr.op === '+' || expr.op === '-') {
        // Dimensions must match
        if (!equal(left.value, right.value)) {
          const leftName = nameOf(left.value) ?? format(left.value);
          const rightName = nameOf(right.value) ?? format(right.value);
          
          return {
            ok: false,
            error: {
              code: 'UNIT_MISMATCH',
              message: `Cannot ${expr.op === '+' ? 'add' : 'subtract'} ${leftName} and ${rightName}`,
              line: expr.line,
              column: expr.column,
            },
          };
        }
        return { ok: true, value: left.value };
      } else if (expr.op === '*') {
        return { ok: true, value: mul(left.value, right.value) };
      } else if (expr.op === '/') {
        return { ok: true, value: div(left.value, right.value) };
      } else if (expr.op === '^' || expr.op === '**') {
        // Exponent must be dimensionless integer literal
        if (!isDimensionless(right.value)) {
          return {
            ok: false,
            error: {
              code: 'UNIT_MISMATCH',
              message: 'Exponent must be dimensionless',
              line: expr.right.line,
              column: expr.right.column,
            },
          };
        }
        
        // Extract integer exponent from literal
        const expValue = extractIntegerLiteral(expr.right);
        if (expValue === null) {
          if (!isDimensionless(left.value)) {
            return {
              ok: false,
              error: {
                code: 'UNIT_MISMATCH',
                message: 'Non-literal exponent requires dimensionless base',
                line: expr.line,
                column: expr.column,
              },
            };
          }
          return { ok: true, value: DIMENSIONLESS };
        }
        
        return { ok: true, value: dimPow(left.value, expValue) };
      }
      
      return { ok: true, value: DIMENSIONLESS };
    }
    
    case 'UnaryOp': {
      // Unary +/- preserves dimension
      return checkExpr(expr.operand, env);
    }
    
    case 'FunctionCall': {
      const fn = KNOWN_FUNCTIONS[expr.name];
      if (!fn) {
        return {
          ok: false,
          error: {
            code: 'UNKNOWN_FUNCTION',
            message: `Unknown function '${expr.name}'`,
            line: expr.line,
            column: expr.column,
          },
        };
      }
      
      if (expr.args.length !== fn.arity) {
        return {
          ok: false,
          error: {
            code: 'WRONG_ARITY',
            message: `Function '${expr.name}' expects ${fn.arity} argument(s), got ${expr.args.length}`,
            line: expr.line,
            column: expr.column,
          },
        };
      }
      
      // Check argument dimension
      if (expr.args.length > 0) {
        const arg = expr.args[0];
        if (!arg) {
          return {
            ok: false,
            error: {
              code: 'WRONG_ARITY',
              message: `Function '${expr.name}' missing argument`,
              line: expr.line,
              column: expr.column,
            },
          };
        }
        
        const argDim = checkExpr(arg, env);
        if (!argDim.ok) return argDim;
        
        // Special case for abs: accepts any dimension
        if (expr.name === 'abs') {
          return { ok: true, value: fn.returnDimension(argDim.value) };
        }
        
        // Other functions require dimensionless arguments
        if (!equal(argDim.value, fn.argDimension)) {
          const argName = nameOf(argDim.value) ?? format(argDim.value);
          return {
            ok: false,
            error: {
              code: 'UNIT_MISMATCH',
              message: `Function '${expr.name}' requires dimensionless argument, got ${argName}`,
              line: arg.line,
              column: arg.column,
            },
          };
        }
      }
      
      return { ok: true, value: fn.returnDimension(DIMENSIONLESS) };
    }
    
    case 'ParenExpr':
      return checkExpr(expr.expr, env);
    
    default:
      return { ok: true, value: DIMENSIONLESS };
  }
}

/**
 * Extract integer literal value from expression
 * Returns null if not a simple integer literal
 */
function extractIntegerLiteral(expr: ExprNode): number | null {
  if (expr.kind === 'NumberLiteral') {
    const val = parseFloat(expr.value);
    if (Number.isInteger(val)) {
      return val;
    }
  } else if (expr.kind === 'UnaryOp' && expr.op === '-') {
    const inner = extractIntegerLiteral(expr.operand);
    if (inner !== null) {
      return -inner;
    }
  }
  return null;
}
