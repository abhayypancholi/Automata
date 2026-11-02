/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StepView } from './StepView';
import type { TraceStep } from '@/engine/trace';

describe('StepView', () => {
  it('renders SubsetStepData correctly', () => {
    const step: TraceStep = {
      index: 0,
      title: 'Process subset',
      explanation: 'Computing epsilon closure',
      data: {
        kind: 'subset',
        phase: 'initial',
        closureResult: ['q0', 'q1'],
      },
    };

    render(<StepView step={step} />);

    expect(screen.getByText(/Initial closure:/i)).toBeInTheDocument();
    expect(screen.getByText(/q0, q1/)).toBeInTheDocument();
  });

  it('renders MinimizeStepData correctly', () => {
    const step: TraceStep = {
      index: 0,
      title: 'Refinement iteration',
      explanation: 'Splitting blocks',
      data: {
        kind: 'minimize',
        phase: 'refine',
        iteration: 1,
        partition: [['q0', 'q1'], ['q2']],
      },
    };

    render(<StepView step={step} />);

    expect(screen.getByText(/Iteration 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Block 0:/i)).toBeInTheDocument();
  });

  it('renders ThompsonStepData correctly', () => {
    const step: TraceStep = {
      index: 0,
      title: 'Build fragment',
      explanation: 'Thompson fragment for literal',
      data: {
        kind: 'thompson',
        description: 'Fragment for symbol a',
        fragment: {
          kind: 'NFA' as const,
          states: ['q0', 'q1'],
          alphabet: ['a'],
          start: 'q0',
          accepting: ['q1'],
          transitions: [{ from: 'q0', symbol: 'a', to: 'q1' }],
        },
      },
    };

    render(<StepView step={step} />);

    expect(screen.getByText(/Fragment for symbol a/i)).toBeInTheDocument();
    expect(screen.getByText(/Fragment automaton:/i)).toBeInTheDocument();
  });

  it('renders ArdenStepData correctly', () => {
    const step: TraceStep = {
      index: 0,
      title: 'Eliminate variable',
      explanation: 'Apply Arden\'s lemma',
      data: {
        kind: 'arden',
        phase: 'eliminate',
        variable: 'X_q0',
        equation: 'a*b',
        identitiesUsed: ['Arden: X = A*B'],
      },
    };

    render(<StepView step={step} />);

    expect(screen.getByText(/X_q0 = a\*b/)).toBeInTheDocument();
    expect(screen.getByText(/Identities applied:/i)).toBeInTheDocument();
  });

  it('renders unknown step kind with fallback', () => {
    const step: TraceStep = {
      index: 0,
      title: 'Unknown step',
      explanation: 'Some explanation',
      data: {
        kind: 'unknown',
        customField: 'value',
      },
    };

    render(<StepView step={step} />);

    // Should render JSON fallback
    expect(screen.getByText(/"kind"/)).toBeInTheDocument();
    expect(screen.getByText(/"unknown"/)).toBeInTheDocument();
  });
});
