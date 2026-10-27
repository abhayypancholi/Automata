/**
 * Grammar definitions for the mini-language
 * 
 * Defines both the original CFG (for display) and the LL(1) form (for parsing).
 * The LL(1) form eliminates left recursion by replacing it with iteration.
 */

import type { TokenType } from '../lexer/tokenDefs';

/**
 * A production rule: NonTerminal -> sequence of terminals/nonterminals
 */
export interface Production {
  lhs: string;           // Left-hand side nonterminal
  rhs: Symbol[];         // Right-hand side symbols
  name?: string;         // Optional name for the production (for derivations)
}

/**
 * A symbol in a production (terminal or nonterminal)
 */
export type Symbol = 
  | { kind: 'terminal'; token: TokenType }
  | { kind: 'nonterminal'; name: string }
  | { kind: 'epsilon' };

/**
 * Grammar representation
 */
export interface Grammar {
  start: string;
  productions: Production[];
  terminals: TokenType[];
  nonterminals: string[];
}

/**
 * Original CFG (shown to users)
 * 
 * From design.md section 7:
 * Program    -> Line | Program NEWLINE Line
 * Line       -> ε | Statement | Statement COMMENT | COMMENT
 * Statement  -> Equation | ParamDecl
 * Equation   -> Lhs '=' Expr ':' UnitExpr Flags
 * ParamDecl  -> IDENT ':' UnitExpr Flags
 * Lhs        -> DIFF | IDENT
 * Flags      -> ε | '(' FlagList ')'
 * FlagList   -> Flag | FlagList ',' Flag
 * Flag       -> IDENT | Flag '-' IDENT
 * Expr       -> Expr '+' Term | Expr '-' Term | Term
 * Term       -> Term '*' Factor | Term '/' Factor | Factor
 * Factor     -> '+' Factor | '-' Factor | Power
 * Power      -> Atom | Atom '^' Factor | Atom '**' Factor
 * Atom       -> NUMBER | BIN | OCT | HEX | IDENT | IDENT '(' ArgList ')' | '(' Expr ')'
 * ArgList    -> ε | Expr | ArgList ',' Expr
 * UnitExpr   -> UnitExpr '*' UnitTerm | UnitExpr '/' UnitTerm | UnitTerm
 * UnitTerm   -> UnitAtom | UnitAtom '^' SignedInt | UnitAtom '**' SignedInt
 * UnitAtom   -> IDENT | NUMBER(1) | '(' UnitExpr ')'
 * SignedInt  -> NUMBER | '-' NUMBER
 */
export const originalGrammar: Grammar = {
  start: 'Program',
  nonterminals: [
    'Program', 'Line', 'Statement', 'Equation', 'ParamDecl', 'Lhs', 'Flags',
    'FlagList', 'Flag', 'Expr', 'Term', 'Factor', 'Power', 'Atom', 'ArgList',
    'UnitExpr', 'UnitTerm', 'UnitAtom', 'SignedInt'
  ],
  terminals: [
    'NUMBER', 'BIN', 'OCT', 'HEX', 'IDENT', 'DIFF',
    'PLUS', 'MINUS', 'STAR', 'SLASH', 'POWER', 'CARET',
    'LPAREN', 'RPAREN', 'COMMA', 'COLON', 'EQUALS',
    'COMMENT', 'NEWLINE'
  ],
  productions: [
    // Program -> Line
    { lhs: 'Program', rhs: [{ kind: 'nonterminal', name: 'Line' }], name: 'Program -> Line' },
    // Program -> Program NEWLINE Line
    { lhs: 'Program', rhs: [
      { kind: 'nonterminal', name: 'Program' },
      { kind: 'terminal', token: 'NEWLINE' },
      { kind: 'nonterminal', name: 'Line' }
    ], name: 'Program -> Program NEWLINE Line' },
    
    // Line -> ε
    { lhs: 'Line', rhs: [{ kind: 'epsilon' }], name: 'Line -> ε' },
    // Line -> Statement
    { lhs: 'Line', rhs: [{ kind: 'nonterminal', name: 'Statement' }], name: 'Line -> Statement' },
    // Line -> Statement COMMENT
    { lhs: 'Line', rhs: [
      { kind: 'nonterminal', name: 'Statement' },
      { kind: 'terminal', token: 'COMMENT' }
    ], name: 'Line -> Statement COMMENT' },
    // Line -> COMMENT
    { lhs: 'Line', rhs: [{ kind: 'terminal', token: 'COMMENT' }], name: 'Line -> COMMENT' },
    
    // Statement -> Equation
    { lhs: 'Statement', rhs: [{ kind: 'nonterminal', name: 'Equation' }], name: 'Statement -> Equation' },
    // Statement -> ParamDecl
    { lhs: 'Statement', rhs: [{ kind: 'nonterminal', name: 'ParamDecl' }], name: 'Statement -> ParamDecl' },
    
    // Equation -> Lhs '=' Expr ':' UnitExpr Flags
    { lhs: 'Equation', rhs: [
      { kind: 'nonterminal', name: 'Lhs' },
      { kind: 'terminal', token: 'EQUALS' },
      { kind: 'nonterminal', name: 'Expr' },
      { kind: 'terminal', token: 'COLON' },
      { kind: 'nonterminal', name: 'UnitExpr' },
      { kind: 'nonterminal', name: 'Flags' }
    ], name: 'Equation -> Lhs = Expr : UnitExpr Flags' },
    
    // ParamDecl -> IDENT ':' UnitExpr Flags
    { lhs: 'ParamDecl', rhs: [
      { kind: 'terminal', token: 'IDENT' },
      { kind: 'terminal', token: 'COLON' },
      { kind: 'nonterminal', name: 'UnitExpr' },
      { kind: 'nonterminal', name: 'Flags' }
    ], name: 'ParamDecl -> IDENT : UnitExpr Flags' },
    
    // Lhs -> DIFF
    { lhs: 'Lhs', rhs: [{ kind: 'terminal', token: 'DIFF' }], name: 'Lhs -> DIFF' },
    // Lhs -> IDENT
    { lhs: 'Lhs', rhs: [{ kind: 'terminal', token: 'IDENT' }], name: 'Lhs -> IDENT' },
    
    // Flags -> ε
    { lhs: 'Flags', rhs: [{ kind: 'epsilon' }], name: 'Flags -> ε' },
    // Flags -> '(' FlagList ')'
    { lhs: 'Flags', rhs: [
      { kind: 'terminal', token: 'LPAREN' },
      { kind: 'nonterminal', name: 'FlagList' },
      { kind: 'terminal', token: 'RPAREN' }
    ], name: 'Flags -> ( FlagList )' },
    
    // FlagList -> Flag
    { lhs: 'FlagList', rhs: [{ kind: 'nonterminal', name: 'Flag' }], name: 'FlagList -> Flag' },
    // FlagList -> FlagList ',' Flag
    { lhs: 'FlagList', rhs: [
      { kind: 'nonterminal', name: 'FlagList' },
      { kind: 'terminal', token: 'COMMA' },
      { kind: 'nonterminal', name: 'Flag' }
    ], name: 'FlagList -> FlagList , Flag' },
    
    // Flag -> IDENT
    { lhs: 'Flag', rhs: [{ kind: 'terminal', token: 'IDENT' }], name: 'Flag -> IDENT' },
    // Flag -> Flag '-' IDENT
    { lhs: 'Flag', rhs: [
      { kind: 'nonterminal', name: 'Flag' },
      { kind: 'terminal', token: 'MINUS' },
      { kind: 'terminal', token: 'IDENT' }
    ], name: 'Flag -> Flag - IDENT' },
    
    // Expr -> Expr '+' Term
    { lhs: 'Expr', rhs: [
      { kind: 'nonterminal', name: 'Expr' },
      { kind: 'terminal', token: 'PLUS' },
      { kind: 'nonterminal', name: 'Term' }
    ], name: 'Expr -> Expr + Term' },
    // Expr -> Expr '-' Term
    { lhs: 'Expr', rhs: [
      { kind: 'nonterminal', name: 'Expr' },
      { kind: 'terminal', token: 'MINUS' },
      { kind: 'nonterminal', name: 'Term' }
    ], name: 'Expr -> Expr - Term' },
    // Expr -> Term
    { lhs: 'Expr', rhs: [{ kind: 'nonterminal', name: 'Term' }], name: 'Expr -> Term' },
    
    // Term -> Term '*' Factor
    { lhs: 'Term', rhs: [
      { kind: 'nonterminal', name: 'Term' },
      { kind: 'terminal', token: 'STAR' },
      { kind: 'nonterminal', name: 'Factor' }
    ], name: 'Term -> Term * Factor' },
    // Term -> Term '/' Factor
    { lhs: 'Term', rhs: [
      { kind: 'nonterminal', name: 'Term' },
      { kind: 'terminal', token: 'SLASH' },
      { kind: 'nonterminal', name: 'Factor' }
    ], name: 'Term -> Term / Factor' },
    // Term -> Factor
    { lhs: 'Term', rhs: [{ kind: 'nonterminal', name: 'Factor' }], name: 'Term -> Factor' },
    
    // Factor -> '+' Factor
    { lhs: 'Factor', rhs: [
      { kind: 'terminal', token: 'PLUS' },
      { kind: 'nonterminal', name: 'Factor' }
    ], name: 'Factor -> + Factor' },
    // Factor -> '-' Factor
    { lhs: 'Factor', rhs: [
      { kind: 'terminal', token: 'MINUS' },
      { kind: 'nonterminal', name: 'Factor' }
    ], name: 'Factor -> - Factor' },
    // Factor -> Power
    { lhs: 'Factor', rhs: [{ kind: 'nonterminal', name: 'Power' }], name: 'Factor -> Power' },
    
    // Power -> Atom
    { lhs: 'Power', rhs: [{ kind: 'nonterminal', name: 'Atom' }], name: 'Power -> Atom' },
    // Power -> Atom '^' Factor
    { lhs: 'Power', rhs: [
      { kind: 'nonterminal', name: 'Atom' },
      { kind: 'terminal', token: 'CARET' },
      { kind: 'nonterminal', name: 'Factor' }
    ], name: 'Power -> Atom ^ Factor' },
    // Power -> Atom '**' Factor
    { lhs: 'Power', rhs: [
      { kind: 'nonterminal', name: 'Atom' },
      { kind: 'terminal', token: 'POWER' },
      { kind: 'nonterminal', name: 'Factor' }
    ], name: 'Power -> Atom ** Factor' },
    
    // Atom -> NUMBER
    { lhs: 'Atom', rhs: [{ kind: 'terminal', token: 'NUMBER' }], name: 'Atom -> NUMBER' },
    // Atom -> BIN
    { lhs: 'Atom', rhs: [{ kind: 'terminal', token: 'BIN' }], name: 'Atom -> BIN' },
    // Atom -> OCT
    { lhs: 'Atom', rhs: [{ kind: 'terminal', token: 'OCT' }], name: 'Atom -> OCT' },
    // Atom -> HEX
    { lhs: 'Atom', rhs: [{ kind: 'terminal', token: 'HEX' }], name: 'Atom -> HEX' },
    // Atom -> IDENT
    { lhs: 'Atom', rhs: [{ kind: 'terminal', token: 'IDENT' }], name: 'Atom -> IDENT' },
    // Atom -> IDENT '(' ArgList ')'
    { lhs: 'Atom', rhs: [
      { kind: 'terminal', token: 'IDENT' },
      { kind: 'terminal', token: 'LPAREN' },
      { kind: 'nonterminal', name: 'ArgList' },
      { kind: 'terminal', token: 'RPAREN' }
    ], name: 'Atom -> IDENT ( ArgList )' },
    // Atom -> '(' Expr ')'
    { lhs: 'Atom', rhs: [
      { kind: 'terminal', token: 'LPAREN' },
      { kind: 'nonterminal', name: 'Expr' },
      { kind: 'terminal', token: 'RPAREN' }
    ], name: 'Atom -> ( Expr )' },
    
    // ArgList -> ε
    { lhs: 'ArgList', rhs: [{ kind: 'epsilon' }], name: 'ArgList -> ε' },
    // ArgList -> Expr
    { lhs: 'ArgList', rhs: [{ kind: 'nonterminal', name: 'Expr' }], name: 'ArgList -> Expr' },
    // ArgList -> ArgList ',' Expr
    { lhs: 'ArgList', rhs: [
      { kind: 'nonterminal', name: 'ArgList' },
      { kind: 'terminal', token: 'COMMA' },
      { kind: 'nonterminal', name: 'Expr' }
    ], name: 'ArgList -> ArgList , Expr' },
    
    // UnitExpr -> UnitExpr '*' UnitTerm
    { lhs: 'UnitExpr', rhs: [
      { kind: 'nonterminal', name: 'UnitExpr' },
      { kind: 'terminal', token: 'STAR' },
      { kind: 'nonterminal', name: 'UnitTerm' }
    ], name: 'UnitExpr -> UnitExpr * UnitTerm' },
    // UnitExpr -> UnitExpr '/' UnitTerm
    { lhs: 'UnitExpr', rhs: [
      { kind: 'nonterminal', name: 'UnitExpr' },
      { kind: 'terminal', token: 'SLASH' },
      { kind: 'nonterminal', name: 'UnitTerm' }
    ], name: 'UnitExpr -> UnitExpr / UnitTerm' },
    // UnitExpr -> UnitTerm
    { lhs: 'UnitExpr', rhs: [{ kind: 'nonterminal', name: 'UnitTerm' }], name: 'UnitExpr -> UnitTerm' },
    
    // UnitTerm -> UnitAtom
    { lhs: 'UnitTerm', rhs: [{ kind: 'nonterminal', name: 'UnitAtom' }], name: 'UnitTerm -> UnitAtom' },
    // UnitTerm -> UnitAtom '^' SignedInt
    { lhs: 'UnitTerm', rhs: [
      { kind: 'nonterminal', name: 'UnitAtom' },
      { kind: 'terminal', token: 'CARET' },
      { kind: 'nonterminal', name: 'SignedInt' }
    ], name: 'UnitTerm -> UnitAtom ^ SignedInt' },
    // UnitTerm -> UnitAtom '**' SignedInt
    { lhs: 'UnitTerm', rhs: [
      { kind: 'nonterminal', name: 'UnitAtom' },
      { kind: 'terminal', token: 'POWER' },
      { kind: 'nonterminal', name: 'SignedInt' }
    ], name: 'UnitTerm -> UnitAtom ** SignedInt' },
    
    // UnitAtom -> IDENT
    { lhs: 'UnitAtom', rhs: [{ kind: 'terminal', token: 'IDENT' }], name: 'UnitAtom -> IDENT' },
    // UnitAtom -> NUMBER(1)
    { lhs: 'UnitAtom', rhs: [{ kind: 'terminal', token: 'NUMBER' }], name: 'UnitAtom -> NUMBER' },
    // UnitAtom -> '(' UnitExpr ')'
    { lhs: 'UnitAtom', rhs: [
      { kind: 'terminal', token: 'LPAREN' },
      { kind: 'nonterminal', name: 'UnitExpr' },
      { kind: 'terminal', token: 'RPAREN' }
    ], name: 'UnitAtom -> ( UnitExpr )' },
    
    // SignedInt -> NUMBER
    { lhs: 'SignedInt', rhs: [{ kind: 'terminal', token: 'NUMBER' }], name: 'SignedInt -> NUMBER' },
    // SignedInt -> '-' NUMBER
    { lhs: 'SignedInt', rhs: [
      { kind: 'terminal', token: 'MINUS' },
      { kind: 'terminal', token: 'NUMBER' }
    ], name: 'SignedInt -> - NUMBER' },
  ]
};

/**
 * LL(1) form (for parsing)
 * 
 * Left recursion eliminated:
 * Expr -> Term (('+' | '-') Term)*
 * Term -> Factor (('*' | '/') Factor)*
 * And similar for FlagList, Flag, ArgList, UnitExpr
 * 
 * Note: This is used internally by the parser but not shown to users.
 * The parser returns an AST that reflects the original grammar.
 */
export const llGrammar: Grammar = {
  // For now, we'll build this incrementally as we implement the parser
  // The actual parsing will use hand-written recursive descent functions
  // that implicitly encode the LL(1) grammar
  ...originalGrammar,
  // TODO: Add LL(1) specific productions if needed for FIRST/FOLLOW computation
};
