import { describe, it, expect } from 'vitest';
import { toFlowGraph } from './toFlowGraph';
import type { Automaton } from '@/engine/automaton/types';

describe('toFlowGraph', () => {
  it('should convert empty automaton', () => {
    const automaton: Automaton = {
      kind: 'DFA',
      states: [],
      alphabet: [],
      start: '',
      accepting: [],
      transitions: [],
    };

    const result = toFlowGraph(automaton);
    expect(result.nodes).toEqual([]);
    expect(result.edges).toEqual([]);
  });

  it('should create nodes for all states', () => {
    const automaton: Automaton = {
      kind: 'DFA',
      states: ['q0', 'q1', 'q2'],
      alphabet: ['a'],
      start: 'q0',
      accepting: ['q2'],
      transitions: [],
    };

    const result = toFlowGraph(automaton);
    expect(result.nodes).toHaveLength(3);
    expect(result.nodes.map((n) => n.id)).toEqual(['q0', 'q1', 'q2']);
  });

  it('should mark start and accepting states', () => {
    const automaton: Automaton = {
      kind: 'DFA',
      states: ['q0', 'q1'],
      alphabet: ['a'],
      start: 'q0',
      accepting: ['q1'],
      transitions: [],
    };

    const result = toFlowGraph(automaton);
    expect(result.nodes.find((n) => n.id === 'q0')?.data.isStart).toBe(true);
    expect(result.nodes.find((n) => n.id === 'q0')?.data.isAccepting).toBe(
      false
    );
    expect(result.nodes.find((n) => n.id === 'q1')?.data.isStart).toBe(false);
    expect(result.nodes.find((n) => n.id === 'q1')?.data.isAccepting).toBe(
      true
    );
  });

  it('should create one edge per unique transition pair', () => {
    const automaton: Automaton = {
      kind: 'DFA',
      states: ['q0', 'q1'],
      alphabet: ['a', 'b'],
      start: 'q0',
      accepting: [],
      transitions: [
        { from: 'q0', symbol: 'a', to: 'q1' },
        { from: 'q0', symbol: 'b', to: 'q1' },
      ],
    };

    const result = toFlowGraph(automaton);
    // Two transitions with same from/to should create one edge with merged label
    expect(result.edges).toHaveLength(1);
    const edge = result.edges[0]!;
    expect(edge).toBeDefined();
    expect(edge.source).toBe('q0');
    expect(edge.target).toBe('q1');
    expect(edge.label).toBe('a, b');
  });

  it('should mark self-loops', () => {
    const automaton: Automaton = {
      kind: 'DFA',
      states: ['q0'],
      alphabet: ['a'],
      start: 'q0',
      accepting: [],
      transitions: [{ from: 'q0', symbol: 'a', to: 'q0' }],
    };

    const result = toFlowGraph(automaton);
    expect(result.edges).toHaveLength(1);
    const edge = result.edges[0]!;
    expect(edge).toBeDefined();
    expect(edge.data!.isSelfLoop).toBe(true);
  });

  it('should detect opposite edges', () => {
    const automaton: Automaton = {
      kind: 'NFA',
      states: ['q0', 'q1'],
      alphabet: ['a', 'b'],
      start: 'q0',
      accepting: [],
      transitions: [
        { from: 'q0', symbol: 'a', to: 'q1' },
        { from: 'q1', symbol: 'b', to: 'q0' },
      ],
    };

    const result = toFlowGraph(automaton);
    expect(result.edges).toHaveLength(2);
    // Both should be marked as having an opposite edge
    const edge0 = result.edges[0]!;
    const edge1 = result.edges[1]!;
    expect(edge0).toBeDefined();
    expect(edge1).toBeDefined();
    expect(edge0.data!.hasOpposite).toBe(true);
    expect(edge1.data!.hasOpposite).toBe(true);
  });

  it('should use layout positions when available', () => {
    const automaton: Automaton = {
      kind: 'DFA',
      states: ['q0'],
      alphabet: [],
      start: 'q0',
      accepting: [],
      transitions: [],
      layout: {
        q0: { x: 100, y: 200 },
      },
    };

    const result = toFlowGraph(automaton);
    const node = result.nodes[0]!;
    expect(node).toBeDefined();
    expect(node.position).toEqual({ x: 100, y: 200 });
  });

  it('should generate default positions when layout missing', () => {
    const automaton: Automaton = {
      kind: 'DFA',
      states: ['q0', 'q1', 'q2'],
      alphabet: [],
      start: 'q0',
      accepting: [],
      transitions: [],
    };

    const result = toFlowGraph(automaton);
    // Should have positions (not undefined)
    const node0 = result.nodes[0]!;
    const node1 = result.nodes[1]!;
    const node2 = result.nodes[2]!;
    expect(node0).toBeDefined();
    expect(node1).toBeDefined();
    expect(node2).toBeDefined();
    expect(node0.position).toBeDefined();
    expect(node1.position).toBeDefined();
    expect(node2.position).toBeDefined();
    // Positions should be different
    expect(node0.position).not.toEqual(node1.position);
  });

  it('should sort merged labels', () => {
    const automaton: Automaton = {
      kind: 'NFA',
      states: ['q0', 'q1'],
      alphabet: ['a', 'b', 'c'],
      start: 'q0',
      accepting: [],
      transitions: [
        { from: 'q0', symbol: 'c', to: 'q1' },
        { from: 'q0', symbol: 'a', to: 'q1' },
        { from: 'q0', symbol: 'b', to: 'q1' },
      ],
    };

    const result = toFlowGraph(automaton);
    const edge = result.edges[0]!;
    expect(edge).toBeDefined();
    expect(edge.label).toBe('a, b, c');
  });
});
