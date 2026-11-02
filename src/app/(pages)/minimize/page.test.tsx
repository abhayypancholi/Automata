/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MinimizePage from './page';

// Mock Zustand store
vi.mock('@/lib/store', () => ({
  useAutomatonStore: vi.fn((selector) => {
    const mockState = {
      automaton: {
        kind: 'DFA',
        states: ['q0', 'q1', 'q2'],
        alphabet: ['a'],
        start: 'q0',
        accepting: ['q2'],
        transitions: [
          { from: 'q0', symbol: 'a', to: 'q1' },
          { from: 'q1', symbol: 'a', to: 'q2' },
          { from: 'q2', symbol: 'a', to: 'q2' },
        ],
      },
      importAutomaton: vi.fn(),
    };
    return selector(mockState);
  }),
}));

// Mock components
vi.mock('@/components/Layout', () => ({
  Layout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/editor/AutomatonEditor', () => ({
  AutomatonEditor: () => <div>Automaton Editor Mock</div>,
}));

vi.mock('@/components/trace/Stepper', () => ({
  Stepper: () => <div>Stepper Mock</div>,
}));

vi.mock('@/components/trace/StepLog', () => ({
  StepLog: () => <div>StepLog Mock</div>,
}));

describe('MinimizePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page with minimize button', () => {
    render(<MinimizePage />);

    expect(screen.getByText(/DFA Minimization/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Minimize DFA/i })).toBeInTheDocument();
  });

  it('calls API and displays result on success', async () => {
    const mockResponse = {
      ok: true,
      data: {
        minimal: {
          kind: 'DFA',
          states: ['{q0,q1}', '{q2}'],
          alphabet: ['a'],
          start: '{q0,q1}',
          accepting: ['{q2}'],
          transitions: [
            { from: '{q0,q1}', symbol: 'a', to: '{q2}' },
            { from: '{q2}', symbol: 'a', to: '{q2}' },
          ],
        },
        alreadyMinimal: false,
        trace: [
          {
            index: 0,
            title: 'Refine',
            explanation: 'Partition refinement',
            data: { kind: 'minimize', phase: 'refine' },
          },
        ],
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    render(<MinimizePage />);

    const minimizeButton = screen.getByRole('button', { name: /Minimize DFA/i });
    fireEvent.click(minimizeButton);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Minimal DFA/i })).toBeInTheDocument();
    });

    expect(screen.getByText(/2 states/i)).toBeInTheDocument();
  });

  it('displays error message on API failure', async () => {
    const mockErrorResponse = {
      ok: false,
      error: {
        code: 'INVALID_AUTOMATON',
        message: 'Not a valid DFA',
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => mockErrorResponse,
    });

    render(<MinimizePage />);

    const minimizeButton = screen.getByRole('button', { name: /Minimize DFA/i });
    fireEvent.click(minimizeButton);

    await waitFor(() => {
      expect(screen.getByText(/Not a valid DFA/i)).toBeInTheDocument();
    });
  });
});
