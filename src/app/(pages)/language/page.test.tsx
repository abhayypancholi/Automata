/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LanguagePage from './page';

vi.mock('@/lib/store', () => ({
  useAutomatonStore: vi.fn((selector) => {
    const mockState = {
      automaton: {
        kind: 'DFA',
        states: ['q0'],
        alphabet: ['a'],
        start: 'q0',
        accepting: ['q0'],
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

describe('LanguagePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page with tabs', () => {
    render(<LanguagePage />);

    expect(screen.getByRole('heading', { name: /Language Classification/i })).toBeInTheDocument();
    // Check for tab buttons, not just text
    const tabs = screen.getAllByRole('button');
    expect(tabs.some(tab => tab.textContent === 'Automaton')).toBe(true);
    expect(tabs.some(tab => tab.textContent === 'Grammar')).toBe(true);
  });

  it('calls API and displays classification result', async () => {
    const mockResponse = {
      ok: true,
      data: {
        class: 'Type 3 (Regular)',
        certainty: 'upper bound',
        reasons: ['Accepted by finite automaton'],
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    render(<LanguagePage />);

    const identifyButton = screen.getByRole('button', { name: /Identify Language Class/i });
    fireEvent.click(identifyButton);

    await waitFor(() => {
      expect(screen.getByText(/Type 3 \(Regular\)/i)).toBeInTheDocument();
    });

    // Check reasons appear - "upper bound" appears in multiple places (result + note)
    const upperBoundElements = screen.getAllByText(/upper bound/i);
    expect(upperBoundElements.length).toBeGreaterThan(0);
  });

  it('displays error message on API failure', async () => {
    const mockErrorResponse = {
      ok: false,
      error: {
        code: 'INVALID_GRAMMAR',
        message: 'Malformed grammar',
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => mockErrorResponse,
    });

    render(<LanguagePage />);

    const identifyButton = screen.getByRole('button', { name: /Identify Language Class/i });
    fireEvent.click(identifyButton);

    await waitFor(() => {
      expect(screen.getByText(/Malformed grammar/i)).toBeInTheDocument();
    });
  });
});
