/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ParserPage from './page';

vi.mock('@/components/Layout', () => ({
  Layout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('ParserPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page with tabs', () => {
    render(<ParserPage />);

    expect(screen.getByRole('heading', { name: /Parser & Unit Checker/i })).toBeInTheDocument();
    // Check that source textarea is present (means page rendered)
    expect(screen.getByPlaceholderText(/I : ampere/i)).toBeInTheDocument();
  });

  it('calls API and displays tokens', async () => {
    const mockResponse = {
      ok: true,
      data: {
        lines: [
          {
            tokens: [
              { type: 'IDENT', text: 'x', line: 1, column: 1 },
              { type: 'NUMBER', text: '5', line: 1, column: 5 },
            ],
          },
        ],
        units: { ok: true },
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    render(<ParserPage />);

    const textarea = screen.getByPlaceholderText(/I : ampere/i);
    fireEvent.change(textarea, { target: { value: 'x = 5 : m' } });

    const parseButton = screen.getByRole('button', { name: /Parse & Check Units/i });
    fireEvent.click(parseButton);

    await waitFor(() => {
      expect(screen.getByText(/Line 1/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/IDENT/i)).toBeInTheDocument();
  });

  it('displays error with caret as specified in requirements', async () => {
    const mockResponse = {
      ok: true,
      data: {
        lines: [
          {
            errors: [
              {
                code: 'UNEXPECTED_CHARACTER',
                message: 'Unexpected character @',
                line: 1,
                column: 5,
              },
            ],
          },
        ],
        units: { ok: false },
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    render(<ParserPage />);

    const textarea = screen.getByPlaceholderText(/I : ampere/i);
    fireEvent.change(textarea, { target: { value: 'x = @' } });

    const parseButton = screen.getByRole('button', { name: /Parse & Check Units/i });
    fireEvent.click(parseButton);

    await waitFor(() => {
      expect(screen.getByText(/Unexpected character @/i)).toBeInTheDocument();
    });

    // Verify caret rendering (checking for the ^ character)
    const caretElement = screen.getByText(/\^/);
    expect(caretElement).toBeInTheDocument();
  });

  it('displays error message on API failure', async () => {
    const mockErrorResponse = {
      ok: false,
      error: {
        code: 'PARSE_ERROR',
        message: 'Syntax error',
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => mockErrorResponse,
    });

    render(<ParserPage />);

    const parseButton = screen.getByRole('button', { name: /Parse & Check Units/i });
    fireEvent.click(parseButton);

    await waitFor(() => {
      expect(screen.getByText(/Syntax error/i)).toBeInTheDocument();
    });
  });
});
