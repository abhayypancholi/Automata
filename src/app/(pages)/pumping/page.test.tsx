/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PumpingPage from './page';

vi.mock('@/lib/store', () => ({
  useAutomatonStore: vi.fn((selector) => {
    const mockState = {
      automaton: {
        kind: 'DFA',
        states: ['q0', 'q1'],
        alphabet: ['a'],
        start: 'q0',
        accepting: ['q1'],
        transitions: [],
      },
    };
    return selector(mockState);
  }),
}));

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

describe('PumpingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page with mode tabs', () => {
    render(<PumpingPage />);

    expect(screen.getByRole('heading', { name: /Pumping Lemma/i })).toBeInTheDocument();
    // Check that language selector is present (means non-regular tab is default)
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('calls API and displays decompositions', async () => {
    const mockResponse = {
      ok: true,
      data: {
        decompositions: [
          {
            x: 'a',
            y: 'a',
            z: 'b',
            verdict: 'fail',
            counterexample: { i: 2, result: false },
          },
        ],
        trace: [],
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    render(<PumpingPage />);

    const testButton = screen.getByRole('button', { name: /Test with Pumping Lemma/i });
    fireEvent.click(testButton);

    await waitFor(() => {
      expect(screen.getByText(/Decompositions/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/✗ Fails/i)).toBeInTheDocument();
  });

  it('displays error message on API failure', async () => {
    const mockErrorResponse = {
      ok: false,
      error: {
        code: 'INVALID_WITNESS',
        message: 'String too short',
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => mockErrorResponse,
    });

    render(<PumpingPage />);

    const testButton = screen.getByRole('button', { name: /Test with Pumping Lemma/i });
    fireEvent.click(testButton);

    await waitFor(() => {
      expect(screen.getByText(/String too short/i)).toBeInTheDocument();
    });
  });
});
