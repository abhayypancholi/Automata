/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RegexPage from './page';

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

describe('RegexPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page with both tabs', () => {
    render(<RegexPage />);

    expect(screen.getByText(/Regular Expression Conversions/i)).toBeInTheDocument();
    expect(screen.getByText(/Regex → NFA \(Thompson\)/i)).toBeInTheDocument();
    expect(screen.getByText(/FA → Regex \(Arden\)/i)).toBeInTheDocument();
  });

  it('Thompson tab: calls API and displays result', async () => {
    const mockResponse = {
      ok: true,
      data: {
        nfa: {
          kind: 'NFA',
          states: ['q0', 'q1', 'q2'],
          alphabet: ['a', 'b'],
          start: 'q0',
          accepting: ['q2'],
          transitions: [],
        },
        trace: [
          {
            index: 0,
            title: 'Build fragment',
            explanation: 'Thompson construction',
            data: { kind: 'thompson' },
          },
        ],
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    render(<RegexPage />);

    // Enter regex
    const input = screen.getByPlaceholderText(/e\.g\., \(a\|b\)\*c/i);
    fireEvent.change(input, { target: { value: 'a*b' } });

    // Click convert
    const convertButton = screen.getByRole('button', { name: /Convert to NFA/i });
    fireEvent.click(convertButton);

    await waitFor(() => {
      expect(screen.getByText(/States:/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/3/)).toBeInTheDocument(); // 3 states
  });

  it('Thompson tab: displays error on API failure', async () => {
    const mockErrorResponse = {
      ok: false,
      error: {
        code: 'UNSUPPORTED_REGEX_FEATURE',
        message: 'Lookahead not supported',
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => mockErrorResponse,
    });

    render(<RegexPage />);

    const input = screen.getByPlaceholderText(/e\.g\., \(a\|b\)\*c/i);
    fireEvent.change(input, { target: { value: '(?=a)' } });

    const convertButton = screen.getByRole('button', { name: /Convert to NFA/i });
    fireEvent.click(convertButton);

    await waitFor(() => {
      expect(screen.getByText(/Lookahead not supported/i)).toBeInTheDocument();
    });
  });

  it('Arden tab: calls API and displays result', async () => {
    const mockResponse = {
      ok: true,
      data: {
        regex: 'a|b*c',
        regexTextbook: 'a+b*c',
        trace: [
          {
            index: 0,
            title: 'Eliminate',
            explanation: 'Arden elimination',
            data: { kind: 'arden' },
          },
        ],
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    render(<RegexPage />);

    // Switch to Arden tab
    const ardenTab = screen.getByText(/FA → Regex \(Arden\)/i);
    fireEvent.click(ardenTab);

    // Click convert
    const convertButton = screen.getByRole('button', { name: /Convert to Regex/i });
    fireEvent.click(convertButton);

    await waitFor(() => {
      expect(screen.getByText(/Result:/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/a\|b\*c/)).toBeInTheDocument();
  });

  it('Arden tab: displays error on API failure', async () => {
    const mockErrorResponse = {
      ok: false,
      error: {
        code: 'INVALID_AUTOMATON',
        message: 'Automaton has cycles',
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => mockErrorResponse,
    });

    render(<RegexPage />);

    // Switch to Arden tab
    const ardenTab = screen.getByText(/FA → Regex \(Arden\)/i);
    fireEvent.click(ardenTab);

    const convertButton = screen.getByRole('button', { name: /Convert to Regex/i });
    fireEvent.click(convertButton);

    await waitFor(() => {
      expect(screen.getByText(/Automaton has cycles/i)).toBeInTheDocument();
    });
  });
});
