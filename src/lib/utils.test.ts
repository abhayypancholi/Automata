import { describe, it, expect } from 'vitest';
import { EPS } from '@/engine/automaton/types';

describe('Path alias test', () => {
  it('should resolve @/ alias correctly', () => {
    // This test verifies that the @/ path alias is working
    expect(EPS).toBe('ε');
  });
});
