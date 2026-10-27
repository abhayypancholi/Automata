/**
 * Recursive descent parser for the mini-language
 * 
 * Algorithm: LL(1) recursive descent with explicit error recovery
 * Grammar from design.md section 7 (LL form with left recursion eliminated)
 * 
 * Key design decisions:
 * - Each nonterminal has a parsing function
 * - Precedence handled by grammar structure (Expr -> Term -> Factor -> Power -> Atom)
 * - Right associativity of ^ and ** achieved by recursion in Factor
 * - Errors use FIRST/FOLLOW for expected tokens
 */

import type { Token } from '../lexer/lex';
import type { TokenType } from '../lexer/tokenDefs';
import { lex } from '../lexer/lex';
import type {
  ProgramNode, LineNode, StatementNode, EquationNode, ParamDeclNode,
  LhsNode, FlagNode, ExprNode, UnitExprNode
} from './ast';
import type { EngineError, Result } from '../errors';

/**
 * Parse result with possible errors
 */
export interface ParseResult {
  ast: ProgramNode;
  errors: EngineError[];
}

/**
 * Parser state
 */
class Parser {
  private tokens: Token[];
  private pos: number;
  private errors: EngineError[];
  
  constructor(tokens: Token[]) {
    this.tokens = tokens.filter(t => t.type !== 'WS'); // Remove whitespace
    this.pos = 0;
    this.errors = [];
  }
  
  /**
   * Current token
   */
  private current(): Token | null {
    return this.tokens[this.pos] ?? null;
  }
  
  /**
   * Peek at token type
   */
  private is(type: TokenType): boolean {
    const tok = this.current();
    return tok !== null && tok.type === type;
  }
  
  /**
   * Check if at end
   */
  private isEnd(): boolean {
    return this.current() === null;
  }
  
  /**
   * Consume token of expected type
   */
  private expect(type: TokenType): Token | null {
    const tok = this.current();
    if (!tok) {
      this.errors.push({
        code: 'UNEXPECTED_EOF',
        message: `Expected ${type} but reached end of input`,
        line: this.tokens[this.tokens.length - 1]?.line ?? 1,
        column: this.tokens[this.tokens.length - 1]?.column ?? 1,
      });
      return null;
    }
    
    if (tok.type !== type) {
      this.errors.push({
        code: 'UNEXPECTED_TOKEN',
        message: `Expected ${type} but found ${tok.type}`,
        line: tok.line,
        column: tok.column,
      });
      return null;
    }
    
    this.pos++;
    return tok;
  }
  
  /**
   * Try to consume token of given type
   */
  private match(type: TokenType): Token | null {
    if (this.is(type)) {
      const tok = this.current()!;
      this.pos++;
      return tok;
    }
    return null;
  }
  
  /**
   * Parse program: sequence of lines
   */
  parseProgram(): ParseResult {
    const lines: LineNode[] = [];
    
    while (!this.isEnd()) {
      const line = this.parseLine();
      if (line) {
        lines.push(line);
      }
      
      // Consume newline if present
      this.match('NEWLINE');
    }
    
    return {
      ast: {
        kind: 'Program',
        lines,
        line: 1,
        column: 1,
      },
      errors: this.errors,
    };
  }
  
  /**
   * Parse line: optional statement with optional comment
   */
  private parseLine(): LineNode | null {
    const tok = this.current();
    if (!tok) return null;
    
    // Empty line or comment-only line
    if (tok.type === 'NEWLINE') {
      return {
        kind: 'Line',
        statement: null,
        line: tok.line,
        column: tok.column,
      };
    }
    
    if (tok.type === 'COMMENT') {
      const comment = tok.text.slice(1).trim(); // Remove #
      this.pos++;
      return {
        kind: 'Line',
        statement: null,
        trailingComment: comment,
        line: tok.line,
        column: tok.column,
      };
    }
    
    // Parse statement
    const statement = this.parseStatement();
    
    // Check for trailing comment
    let trailingComment: string | undefined;
    const commentTok = this.match('COMMENT');
    if (commentTok) {
      trailingComment = commentTok.text.slice(1).trim();
    }
    
    return {
      kind: 'Line',
      statement,
      trailingComment,
      line: tok.line,
      column: tok.column,
    };
  }
  
  /**
   * Parse statement: equation or param decl
   */
  private parseStatement(): StatementNode | null {
    const tok = this.current();
    if (!tok) return null;
    
    // Look ahead to distinguish equation from param decl
    // Equation: (IDENT | DIFF) '='
    // ParamDecl: IDENT ':'
    
    if (tok.type === 'DIFF') {
      // Must be equation
      return this.parseEquation();
    }
    
    if (tok.type === 'IDENT') {
      // Look ahead for '=' or ':'
      const nextPos = this.pos + 1;
      const nextTok = this.tokens[nextPos];
      
      if (nextTok?.type === 'EQUALS') {
        return this.parseEquation();
      } else if (nextTok?.type === 'COLON') {
        return this.parseParamDecl();
      }
    }
    
    this.errors.push({
      code: 'UNEXPECTED_TOKEN',
      message: `Expected statement but found ${tok.type}`,
      line: tok.line,
      column: tok.column,
    });
    
    // Skip to next line
    while (!this.isEnd() && !this.is('NEWLINE')) {
      this.pos++;
    }
    
    return null;
  }
  
  /**
   * Parse equation: lhs = expr : unit flags
   */
  private parseEquation(): EquationNode | null {
    const tok = this.current();
    if (!tok) return null;
    
    const lhs = this.parseLhs();
    if (!lhs) return null;
    
    if (!this.expect('EQUALS')) return null;
    
    const expr = this.parseExpr();
    if (!expr) return null;
    
    if (!this.expect('COLON')) return null;
    
    const unit = this.parseUnitExpr();
    if (!unit) return null;
    
    const flags = this.parseFlags();
    
    return {
      kind: 'Equation',
      lhs,
      expr,
      unit,
      flags,
      line: tok.line,
      column: tok.column,
    };
  }
  
  /**
   * Parse parameter declaration: ident : unit flags
   */
  private parseParamDecl(): ParamDeclNode | null {
    const tok = this.expect('IDENT');
    if (!tok) return null;
    
    if (!this.expect('COLON')) return null;
    
    const unit = this.parseUnitExpr();
    if (!unit) return null;
    
    const flags = this.parseFlags();
    
    return {
      kind: 'ParamDecl',
      name: tok.text,
      unit,
      flags,
      line: tok.line,
      column: tok.column,
    };
  }
  
  /**
   * Parse lhs: IDENT | DIFF
   */
  private parseLhs(): LhsNode | null {
    const tok = this.current();
    if (!tok) return null;
    
    if (tok.type === 'IDENT') {
      this.pos++;
      return {
        kind: 'IdentLhs',
        name: tok.text,
        line: tok.line,
        column: tok.column,
      };
    }
    
    if (tok.type === 'DIFF') {
      this.pos++;
      // Extract variable name from dv/dt
      const match = tok.text.match(/^d([a-zA-Z_][a-zA-Z0-9_]*)\/dt$/);
      const variable = match ? match[1]! : tok.text;
      
      return {
        kind: 'DiffLhs',
        variable,
        line: tok.line,
        column: tok.column,
      };
    }
    
    return null;
  }
  
  /**
   * Parse flags: empty | '(' flaglist ')'
   */
  private parseFlags(): FlagNode[] {
    if (!this.match('LPAREN')) {
      return [];
    }
    
    const flags: FlagNode[] = [];
    
    // Parse first flag
    let flag = this.parseFlag();
    if (flag) {
      flags.push(flag);
    }
    
    // Parse remaining flags
    while (this.match('COMMA')) {
      flag = this.parseFlag();
      if (flag) {
        flags.push(flag);
      }
    }
    
    this.expect('RPAREN');
    return flags;
  }
  
  /**
   * Parse flag: ident ('-' ident)*
   */
  private parseFlag(): FlagNode | null {
    const tok = this.expect('IDENT');
    if (!tok) return null;
    
    const parts: string[] = [tok.text];
    
    // Handle hyphenated flags (clock-driven)
    while (this.match('MINUS')) {
      const part = this.expect('IDENT');
      if (part) {
        parts.push(part.text);
      }
    }
    
    return {
      kind: 'Flag',
      parts,
      line: tok.line,
      column: tok.column,
    };
  }
  
  /**
   * Parse expression: term (('+' | '-') term)*
   */
  private parseExpr(): ExprNode | null {
    let left = this.parseTerm();
    if (!left) return null;
    
    while (this.is('PLUS') || this.is('MINUS')) {
      const opTok = this.current()!;
      const op = opTok.type === 'PLUS' ? '+' : '-';
      this.pos++;
      
      const right = this.parseTerm();
      if (!right) break;
      
      left = {
        kind: 'BinaryOp',
        op: op as '+' | '-',
        left,
        right,
        line: opTok.line,
        column: opTok.column,
      };
    }
    
    return left;
  }
  
  /**
   * Parse term: factor (('*' | '/') factor)*
   */
  private parseTerm(): ExprNode | null {
    let left = this.parseFactor();
    if (!left) return null;
    
    while (this.is('STAR') || this.is('SLASH')) {
      const opTok = this.current()!;
      const op = opTok.type === 'STAR' ? '*' : '/';
      this.pos++;
      
      const right = this.parseFactor();
      if (!right) break;
      
      left = {
        kind: 'BinaryOp',
        op: op as '*' | '/',
        left,
        right,
        line: opTok.line,
        column: opTok.column,
      };
    }
    
    return left;
  }
  
  /**
   * Parse factor: ('+' | '-')? power
   */
  private parseFactor(): ExprNode | null {
    const tok = this.current();
    if (!tok) return null;
    
    // Unary operators
    if (tok.type === 'PLUS' || tok.type === 'MINUS') {
      const op = tok.type === 'PLUS' ? '+' : '-';
      this.pos++;
      
      const operand = this.parseFactor();
      if (!operand) return null;
      
      return {
        kind: 'UnaryOp',
        op: op as '+' | '-',
        operand,
        line: tok.line,
        column: tok.column,
      };
    }
    
    return this.parsePower();
  }
  
  /**
   * Parse power: atom (('^' | '**') factor)?
   * Right-associative: 2^3^2 = 2^(3^2)
   */
  private parsePower(): ExprNode | null {
    const atom = this.parseAtom();
    if (!atom) return null;
    
    if (this.is('CARET') || this.is('POWER')) {
      const opTok = this.current()!;
      const op = opTok.type === 'CARET' ? '^' : '**';
      this.pos++;
      
      // Right-associative: recurse to factor
      const right = this.parseFactor();
      if (!right) return atom;
      
      return {
        kind: 'BinaryOp',
        op: op as '^' | '**',
        left: atom,
        right,
        line: opTok.line,
        column: opTok.column,
      };
    }
    
    return atom;
  }
  
  /**
   * Parse atom: literal | ident | function call | '(' expr ')'
   */
  private parseAtom(): ExprNode | null {
    const tok = this.current();
    if (!tok) return null;
    
    // Number literals
    if (tok.type === 'NUMBER') {
      this.pos++;
      return {
        kind: 'NumberLiteral',
        value: tok.text,
        line: tok.line,
        column: tok.column,
      };
    }
    
    if (tok.type === 'BIN') {
      this.pos++;
      return {
        kind: 'BinaryLiteral',
        value: tok.text,
        line: tok.line,
        column: tok.column,
      };
    }
    
    if (tok.type === 'OCT') {
      this.pos++;
      return {
        kind: 'OctalLiteral',
        value: tok.text,
        line: tok.line,
        column: tok.column,
      };
    }
    
    if (tok.type === 'HEX') {
      this.pos++;
      return {
        kind: 'HexLiteral',
        value: tok.text,
        line: tok.line,
        column: tok.column,
      };
    }
    
    // Identifier or function call
    if (tok.type === 'IDENT') {
      const name = tok.text;
      this.pos++;
      
      // Check for function call
      if (this.match('LPAREN')) {
        const args: ExprNode[] = [];
        
        // Parse arguments
        if (!this.is('RPAREN')) {
          const arg = this.parseExpr();
          if (arg) {
            args.push(arg);
          }
          
          while (this.match('COMMA')) {
            const nextArg = this.parseExpr();
            if (nextArg) {
              args.push(nextArg);
            }
          }
        }
        
        this.expect('RPAREN');
        
        return {
          kind: 'FunctionCall',
          name,
          args,
          line: tok.line,
          column: tok.column,
        };
      }
      
      // Just identifier
      return {
        kind: 'Identifier',
        name,
        line: tok.line,
        column: tok.column,
      };
    }
    
    // Parenthesized expression
    if (tok.type === 'LPAREN') {
      this.pos++;
      const expr = this.parseExpr();
      this.expect('RPAREN');
      
      if (!expr) return null;
      
      return {
        kind: 'ParenExpr',
        expr,
        line: tok.line,
        column: tok.column,
      };
    }
    
    this.errors.push({
      code: 'UNEXPECTED_TOKEN',
      message: `Expected expression but found ${tok.type}`,
      line: tok.line,
      column: tok.column,
    });
    
    return null;
  }
  
  /**
   * Parse unit expression: unit term (('*' | '/') unit term)*
   */
  private parseUnitExpr(): UnitExprNode | null {
    let left = this.parseUnitTerm();
    if (!left) return null;
    
    while (this.is('STAR') || this.is('SLASH')) {
      const opTok = this.current()!;
      const op = opTok.type === 'STAR' ? '*' : '/';
      this.pos++;
      
      const right = this.parseUnitTerm();
      if (!right) break;
      
      left = {
        kind: 'UnitBinaryOp',
        op: op as '*' | '/',
        left,
        right,
        line: opTok.line,
        column: opTok.column,
      };
    }
    
    return left;
  }
  
  /**
   * Parse unit term: unit atom (('^' | '**') signed int)?
   */
  private parseUnitTerm(): UnitExprNode | null {
    const atom = this.parseUnitAtom();
    if (!atom) return null;
    
    if (this.is('CARET') || this.is('POWER')) {
      this.pos++; // consume ^ or **
      
      let sign = 1;
      if (this.match('MINUS')) {
        sign = -1;
      }
      
      const numTok = this.expect('NUMBER');
      if (!numTok) return atom;
      
      const exponent = sign * parseInt(numTok.text, 10);
      
      return {
        kind: 'UnitPower',
        base: atom,
        exponent,
        line: atom.line,
        column: atom.column,
      };
    }
    
    return atom;
  }
  
  /**
   * Parse unit atom: ident | number | '(' unit expr ')'
   */
  private parseUnitAtom(): UnitExprNode | null {
    const tok = this.current();
    if (!tok) return null;
    
    if (tok.type === 'IDENT') {
      this.pos++;
      return {
        kind: 'UnitIdentifier',
        name: tok.text,
        line: tok.line,
        column: tok.column,
      };
    }
    
    if (tok.type === 'NUMBER') {
      this.pos++;
      return {
        kind: 'UnitNumber',
        value: tok.text,
        line: tok.line,
        column: tok.column,
      };
    }
    
    if (tok.type === 'LPAREN') {
      this.pos++;
      const unit = this.parseUnitExpr();
      this.expect('RPAREN');
      
      if (!unit) return null;
      
      return {
        kind: 'UnitParen',
        unit,
        line: tok.line,
        column: tok.column,
      };
    }
    
    this.errors.push({
      code: 'UNEXPECTED_TOKEN',
      message: `Expected unit but found ${tok.type}`,
      line: tok.line,
      column: tok.column,
    });
    
    return null;
  }
}

/**
 * Parse source code into AST
 */
export function parse(source: string): Result<ParseResult> {
  // Lex the input
  const lexResult = lex(source);
  if (!lexResult.ok) {
    return lexResult;
  }
  
  // Parse tokens
  const parser = new Parser(lexResult.value.tokens);
  const parseResult = parser.parseProgram();
  
  // If there are parse errors, return them
  if (parseResult.errors.length > 0) {
    return {
      ok: false,
      error: parseResult.errors[0]!, // Return first error
    };
  }
  
  return {
    ok: true,
    value: parseResult,
  };
}
