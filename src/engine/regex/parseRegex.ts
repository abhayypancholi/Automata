/**
 * Regex parser adapter
 * 
 * Uses regexp-tree to parse, then converts to our RegexNode format.
 * Rejects unsupported features with precise error messages.
 */

import * as regexpTree from 'regexp-tree';
import type { RegexNode } from './types';
import type { Result } from '../errors';

/**
 * Parse a regex string into our AST format
 * 
 * Input: regex source (no delimiters, no flags)
 * Output: RegexNode AST and alphabet
 */
export function parseRegex(source: string): Result<{
  ast: RegexNode;
  alphabet: string[];
}> {
  // Parse with regexp-tree (add delimiters)
  let parsed;
  try {
    parsed = regexpTree.parse(`/${source}/`);
  } catch (e) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_REGEX_FEATURE',
        message: `Invalid regex syntax: ${e instanceof Error ? e.message : String(e)}`,
      },
    };
  }

  // Check for unsupported flags
  if (parsed.flags) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_REGEX_FEATURE',
        message: 'Regex flags are not supported',
      },
    };
  }

  const alphabet = new Set<string>();

  // Convert to our format
  function convert(node: unknown): Result<RegexNode> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const n = node as any; // regexp-tree types are not exported, using any for AST node
    
    switch (n.type) {
      case 'Char':
        if (n.kind !== 'simple') {
          return {
            ok: false,
            error: {
              code: 'UNSUPPORTED_REGEX_FEATURE',
              message: `Character escape ${n.value} is not supported`,
            },
          };
        }
        alphabet.add(n.symbol);
        return { ok: true, value: { type: 'literal', value: n.symbol } };

      case 'Alternative':
        // Concatenation (sequence of expressions)
        if (!n.expressions || n.expressions.length === 0) {
          return { ok: true, value: { type: 'epsilon' } };
        }
        
        const children: RegexNode[] = [];
        for (const expr of n.expressions) {
          const result = convert(expr);
          if (!result.ok) return result;
          children.push(result.value);
        }
        
        if (children.length === 1) {
          return { ok: true, value: children[0]! };
        }
        
        return { ok: true, value: { type: 'concat', children } };

      case 'Disjunction':
        // Union a|b
        const leftResult = convert(n.left);
        if (!leftResult.ok) return leftResult;
        
        const rightResult = convert(n.right);
        if (!rightResult.ok) return rightResult;
        
        return {
          ok: true,
          value: { type: 'union', left: leftResult.value, right: rightResult.value },
        };

      case 'Repetition':
        const childResult = convert(n.expression);
        if (!childResult.ok) return childResult;
        
        const kind = n.quantifier.kind;
        
        if (kind === '*') {
          return { ok: true, value: { type: 'star', child: childResult.value } };
        } else if (kind === '+') {
          return { ok: true, value: { type: 'plus', child: childResult.value } };
        } else if (kind === '?') {
          return { ok: true, value: { type: 'optional', child: childResult.value } };
        } else if (kind === 'Range') {
          return {
            ok: false,
            error: {
              code: 'UNSUPPORTED_REGEX_FEATURE',
              message: `Counted repetition {${n.quantifier.from},${n.quantifier.to || ''}} is not supported`,
            },
          };
        } else {
          return {
            ok: false,
            error: {
              code: 'UNSUPPORTED_REGEX_FEATURE',
              message: `Quantifier ${kind} is not supported`,
            },
          };
        }

      case 'Group':
        // Grouping (capturing or non-capturing, we treat the same)
        if (!n.expression) {
          // Empty group = epsilon
          return { ok: true, value: { type: 'epsilon' } };
        }
        return convert(n.expression);

      case 'CharacterClass':
        // [abc] or [a-z]
        if (n.negative) {
          return {
            ok: false,
            error: {
              code: 'UNSUPPORTED_REGEX_FEATURE',
              message: 'Negated character classes [^...] are not supported',
            },
          };
        }
        
        const chars: string[] = [];
        
        for (const expr of n.expressions) {
          if (expr.type === 'Char') {
            if (expr.kind !== 'simple') {
              return {
                ok: false,
                error: {
                  code: 'UNSUPPORTED_REGEX_FEATURE',
                  message: `Character escape ${expr.value} in class is not supported`,
                },
              };
            }
            chars.push(expr.symbol);
            alphabet.add(expr.symbol);
          } else if (expr.type === 'ClassRange') {
            // Expand range
            const fromCode = expr.from.codePoint;
            const toCode = expr.to.codePoint;
            
            for (let code = fromCode; code <= toCode; code++) {
              const char = String.fromCodePoint(code);
              chars.push(char);
              alphabet.add(char);
            }
          } else {
            return {
              ok: false,
              error: {
                code: 'UNSUPPORTED_REGEX_FEATURE',
                message: `Character class expression type ${expr.type} is not supported`,
              },
            };
          }
        }
        
        return { ok: true, value: { type: 'class', chars } };

      case 'Backreference':
        return {
          ok: false,
          error: {
            code: 'UNSUPPORTED_REGEX_FEATURE',
            message: 'Backreferences are not supported',
          },
        };

      case 'Assertion':
        return {
          ok: false,
          error: {
            code: 'UNSUPPORTED_REGEX_FEATURE',
            message: `Assertion ${n.kind} is not supported (anchors, lookahead, lookbehind)`,
          },
        };

      default:
        return {
          ok: false,
          error: {
            code: 'UNSUPPORTED_REGEX_FEATURE',
            message: `Regex feature ${n.type} is not supported`,
          },
        };
    }
  }

  const astResult = convert(parsed.body);
  if (!astResult.ok) return astResult;

  return {
    ok: true,
    value: {
      ast: astResult.value,
      alphabet: Array.from(alphabet).sort(),
    },
  };
}
