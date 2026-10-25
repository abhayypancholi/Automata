/**
 * Regex printer: Convert AST to string with minimal parentheses
 * 
 * Supports two forms:
 * - canonical: uses | for union
 * - textbook: uses + for union
 */

import type { RegexNode } from './types';

type PrintMode = 'canonical' | 'textbook';

/**
 * Operator precedence (lower number = lower precedence, needs parens in higher context)
 * concat > union
 * postfix (*, +, ?) > concat
 */
const enum Precedence {
  Union = 1,
  Concat = 2,
  Postfix = 3,
  Atom = 4,
}

function getPrecedence(node: RegexNode): Precedence {
  switch (node.type) {
    case 'union':
      return Precedence.Union;
    case 'concat':
      return Precedence.Concat;
    case 'star':
    case 'plus':
    case 'optional':
      return Precedence.Postfix;
    case 'literal':
    case 'epsilon':
    case 'class':
      return Precedence.Atom;
  }
}

function needsParens(node: RegexNode, parentPrecedence: Precedence): boolean {
  return getPrecedence(node) < parentPrecedence;
}

function printNode(node: RegexNode, mode: PrintMode, parentPrecedence: Precedence = Precedence.Union): string {
  switch (node.type) {
    case 'literal':
      // Escape special regex characters
      if (['*', '+', '?', '|', '(', ')', '[', ']', '\\', '^', '$', '.'].includes(node.value)) {
        return `\\${node.value}`;
      }
      return node.value;
    
    case 'epsilon':
      return '()';
    
    case 'concat': {
      const parts = node.children.map(child => 
        printNode(child, mode, Precedence.Concat)
      );
      const result = parts.join('');
      return needsParens(node, parentPrecedence) ? `(${result})` : result;
    }
    
    case 'union': {
      const unionSymbol = mode === 'textbook' ? '+' : '|';
      const left = printNode(node.left, mode, Precedence.Union);
      const right = printNode(node.right, mode, Precedence.Union);
      const result = `${left}${unionSymbol}${right}`;
      return needsParens(node, parentPrecedence) ? `(${result})` : result;
    }
    
    case 'star': {
      const child = printNode(node.child, mode, Precedence.Postfix);
      return `${child}*`;
    }
    
    case 'plus': {
      const child = printNode(node.child, mode, Precedence.Postfix);
      return `${child}+`;
    }
    
    case 'optional': {
      const child = printNode(node.child, mode, Precedence.Postfix);
      return `${child}?`;
    }
    
    case 'class': {
      if (node.chars.length === 0) {
        return '[]';
      }
      if (node.chars.length === 1) {
        return printNode({ type: 'literal', value: node.chars[0]! }, mode, parentPrecedence);
      }
      
      // Print as character class [abc]
      const escaped = node.chars.map(c => {
        if ([']', '\\', '-'].includes(c)) {
          return `\\${c}`;
        }
        return c;
      });
      return `[${escaped.join('')}]`;
    }
  }
}

/**
 * Print regex AST in canonical form (using |)
 */
export function printCanonical(ast: RegexNode): string {
  return printNode(ast, 'canonical');
}

/**
 * Print regex AST in textbook form (using + for union)
 */
export function printTextbook(ast: RegexNode): string {
  return printNode(ast, 'textbook');
}
