/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NumbersPage from './page';

vi.mock('@/components/Layout', () => ({
  Layout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('NumbersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page with tabs', () => {
    render(<NumbersPage />);

    expect(screen.getByRole('heading', { name: /Number Systems/i })).toBeInTheDocument();
    // Tabs are present - convert tab is active by default
    expect(screen.getByPlaceholderText(/e\.g\., 1010/i)).toBeInTheDocument();
  });

  it('calls API and displays result on success', async () => {
    const mockResponse = {
      ok: true,
      data: { output: '12' },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    render(<NumbersPage />);

    const input = screen.getByPlaceholderText(/e\.g\., 1010/i);
    fireEvent.change(input, { target: { value: '1010' } });

    // Find the action button (not the tab button) - filter by class
    const buttons = screen.getAllByRole('button', { name: 'Convert' });
    const convertButton = buttons.find(btn => btn.className.includes('rounded-lg'));
    
    expect(convertButton).toBeDefined();
    if (convertButton) {
      fireEvent.click(convertButton);
    }

    // Wait for the result to appear - check for the output value
    await waitFor(() => {
      expect(screen.getByText('12')).toBeInTheDocument();
    });
  });

  it('displays error message on API failure', async () => {
    const mockErrorResponse = {
      ok: false,
      error: {
        code: 'INVALID_NUMBER',
        message: 'Invalid binary number',
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => mockErrorResponse,
    });

    render(<NumbersPage />);

    const input = screen.getByPlaceholderText(/e\.g\., 1010/i);
    fireEvent.change(input, { target: { value: 'xyz' } });

    // Find the action button (not the tab button) - filter by class
    const buttons = screen.getAllByRole('button', { name: 'Convert' });
    const convertButton = buttons.find(btn => btn.className.includes('rounded-lg'));
    
    expect(convertButton).toBeDefined();
    if (convertButton) {
      fireEvent.click(convertButton);
    }

    await waitFor(() => {
      expect(screen.getByText(/Invalid binary number/i)).toBeInTheDocument();
    });
  });
});
