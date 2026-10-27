/**
 * FIRST and FOLLOW set computation for CFG
 * 
 * Algorithm: Standard fixed-point iteration
 * - FIRST(X) = set of terminals that can start strings derived from X
 * - FOLLOW(X) = set of terminals that can appear immediately after X
 * 
 * Reference: Aho-Lam-Sethi-Ullman "Compilers: Principles, Techniques, and Tools"
 */

import type { Grammar } from './grammar';
import type { TokenType } from '../lexer/tokenDefs';

export type FirstSet = Map<string, Set<TokenType | 'ε'>>;
export type FollowSet = Map<string, Set<TokenType | '$'>>;

/**
 * Compute FIRST sets for all nonterminals
 * 
 * FIRST(X) algorithm:
 * 1. If X is terminal, FIRST(X) = {X}
 * 2. If X -> ε is a production, add ε to FIRST(X)
 * 3. If X -> Y1 Y2 ... Yn:
 *    - Add FIRST(Y1) - {ε} to FIRST(X)
 *    - If Y1 =>* ε, add FIRST(Y2) - {ε}, and so on
 *    - If all Yi =>* ε, add ε to FIRST(X)
 */
export function computeFirst(grammar: Grammar): FirstSet {
  const first = new Map<string, Set<TokenType | 'ε'>>();
  
  // Initialize
  for (const nt of grammar.nonterminals) {
    first.set(nt, new Set());
  }
  
  // Fixed-point iteration
  let changed = true;
  while (changed) {
    changed = false;
    
    for (const prod of grammar.productions) {
      const lhsFirst = first.get(prod.lhs)!;
      const oldSize = lhsFirst.size;
      
      if (prod.rhs.length === 0 || (prod.rhs.length === 1 && prod.rhs[0]?.kind === 'epsilon')) {
        // X -> ε
        lhsFirst.add('ε');
      } else {
        // X -> Y1 Y2 ... Yn
        let allNullable = true;
        
        for (const symbol of prod.rhs) {
          if (symbol.kind === 'terminal') {
            lhsFirst.add(symbol.token);
            allNullable = false;
            break;
          } else if (symbol.kind === 'nonterminal') {
            const symbolFirst = first.get(symbol.name)!;
            for (const t of symbolFirst) {
              if (t !== 'ε') {
                lhsFirst.add(t);
              }
            }
            
            if (!symbolFirst.has('ε')) {
              allNullable = false;
              break;
            }
          } else if (symbol.kind === 'epsilon') {
            // Skip epsilon in the middle of a production
            continue;
          }
        }
        
        if (allNullable) {
          lhsFirst.add('ε');
        }
      }
      
      if (lhsFirst.size > oldSize) {
        changed = true;
      }
    }
  }
  
  return first;
}

/**
 * Compute FOLLOW sets for all nonterminals
 * 
 * FOLLOW(X) algorithm:
 * 1. Add $ to FOLLOW(start)
 * 2. If A -> α B β:
 *    - Add FIRST(β) - {ε} to FOLLOW(B)
 *    - If β =>* ε, add FOLLOW(A) to FOLLOW(B)
 */
export function computeFollow(grammar: Grammar, first: FirstSet): FollowSet {
  const follow = new Map<string, Set<TokenType | '$'>>();
  
  // Initialize
  for (const nt of grammar.nonterminals) {
    follow.set(nt, new Set());
  }
  
  // Add $ to FOLLOW(start)
  follow.get(grammar.start)!.add('$');
  
  // Fixed-point iteration
  let changed = true;
  while (changed) {
    changed = false;
    
    for (const prod of grammar.productions) {
      const rhs = prod.rhs;
      
      for (let i = 0; i < rhs.length; i++) {
        const symbol = rhs[i]!;
        
        if (symbol.kind !== 'nonterminal') {
          continue;
        }
        
        const symbolFollow = follow.get(symbol.name)!;
        const oldSize = symbolFollow.size;
        
        // Look at what comes after this nonterminal
        const beta = rhs.slice(i + 1);
        
        if (beta.length === 0) {
          // B is at the end, add FOLLOW(A) to FOLLOW(B)
          const lhsFollow = follow.get(prod.lhs)!;
          for (const t of lhsFollow) {
            symbolFollow.add(t);
          }
        } else {
          // Compute FIRST(β)
          let betaNullable = true;
          for (const betaSymbol of beta) {
            if (betaSymbol.kind === 'terminal') {
              symbolFollow.add(betaSymbol.token);
              betaNullable = false;
              break;
            } else if (betaSymbol.kind === 'nonterminal') {
              const betaFirst = first.get(betaSymbol.name)!;
              for (const t of betaFirst) {
                if (t !== 'ε') {
                  symbolFollow.add(t as TokenType);
                }
              }
              
              if (!betaFirst.has('ε')) {
                betaNullable = false;
                break;
              }
            } else if (betaSymbol.kind === 'epsilon') {
              continue;
            }
          }
          
          // If β =>* ε, add FOLLOW(A) to FOLLOW(B)
          if (betaNullable) {
            const lhsFollow = follow.get(prod.lhs)!;
            for (const t of lhsFollow) {
              symbolFollow.add(t);
            }
          }
        }
        
        if (symbolFollow.size > oldSize) {
          changed = true;
        }
      }
    }
  }
  
  return follow;
}

/**
 * Format FIRST set for display
 */
export function formatFirst(first: FirstSet): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const [nt, set] of first) {
    result[nt] = Array.from(set).sort();
  }
  return result;
}

/**
 * Format FOLLOW set for display
 */
export function formatFollow(follow: FollowSet): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const [nt, set] of follow) {
    result[nt] = Array.from(set).sort();
  }
  return result;
}
