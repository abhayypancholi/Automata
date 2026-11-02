/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NfaToDfaPage from './page';

// Mock Zustand store
vi.mock('@/lib/store', () => ({
  useAutomatonStore: vi.fn((selector) => {
    const mockState = {
      automaton: {
        kind: 'NFA',
        states: ['q0', 'q1'],
        alphabet: ['a'],
        start: 'q0',
        accepting: ['q1'],
        transitions: [{ from: 'q0', symbol: 'a', to: 'q1' }],
      },
      importAutomaton: vi.fn(),
    };
    return selector(mockState);
  }),
}));

// Mock components to avoid rendering complexity
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

describe('NfaToDfaPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page with convert button', () => {
    render(<NfaToDfaPage />);

    expect(screen.getByText(/NFA to DFA Conversion/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Convert to DFA/i })).toBeInTheDocument();
  });

  it('calls API and displays result on success', async () => {
    const mockResponse = {
      ok: true,
      data: {
        dfa: {
          kind: 'DFA',
          states: ['{q0}', '{q1}'],
          alphabet: ['a'],
          start: '{q0}',
          accepting: ['{q1}'],
          transitions: [{ from: '{q0}', symbol: 'a', to: '{q1}' }],
        },
        trace: [
          {
            index: 0,
            title: 'Start',
            explanation: 'Initial closure',
            data: { kind: 'subset', phase: 'initial' },
          },
        ],
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    render(<NfaToDfaPage />);

    const convertButton = screen.getByRole('button', { name: /Convert to DFA/i });
    fireEvent.click(convertButton);

    await waitFor(() => {
      expect(screen.getByText(/Result DFA/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/2 states/i)).toBeInTheDocument();
  });

  it('displays error message on API failure', async () => {
    const mockErrorResponse = {
      ok: false,
      error: {
        code: 'INVALID_AUTOMATON',
        message: 'Invalid automaton structure',
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => mockErrorResponse,
    });

    render(<NfaToDfaPage />);

    const convertButton = screen.getByRole('button', { name: /Convert to DFA/i });
    fireEvent.click(convertButton);

    await waitFor(() => {
      expect(screen.getByText(/Invalid automaton structure/i)).toBeInTheDocument();
    });
  });
});
