/**
 * Regex AST types (our own representation)
 * 
 * Supported constructs:
 * - Literals (characters)
 * - Concatenation (sequence)
 * - Union (alternation) |
 * - Kleene star *
 * - Plus +
 * - Optional ?
 * - Grouping ()
 * - Character classes [abc] [a-z]
 * - Empty group () = epsilon
 */

export type RegexNode =
  | { type: 'literal'; value: string } // Single character
  | { type: 'epsilon' } // Empty string
  | { type: 'concat'; children: RegexNode[] } // Sequence
  | { type: 'union'; left: RegexNode; right: RegexNode } // a|b
  | { type: 'star'; child: RegexNode } // a*
  | { type: 'plus'; child: RegexNode } // a+
  | { type: 'optional'; child: RegexNode } // a?
  | { type: 'class'; chars: string[] }; // [abc] expanded to union
