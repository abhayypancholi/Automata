/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StepLog } from './StepLog';

describe('StepLog', () => {
  it('should render collapsed by default', () => {
    const steps = [
      {
        index: 0,
        title: 'Start',
        explanation: 'Begin simulation',
        data: { kind: 'simulate' as const, from: ['q0'], to: [] },
      },
    ];

    render(<StepLog steps={steps} currentStep={0} />);
    
    // Should show summary
    expect(screen.getByText(/Show steps/i)).toBeInTheDocument();
  });

  it('should display step count in summary', () => {
    const steps = [
      { index: 0, title: 'Step 1', explanation: 'Ex 1', data: { kind: 'simulate' as const, from: ['q0'], to: [] } },
      { index: 1, title: 'Step 2', explanation: 'Ex 2', data: { kind: 'simulate' as const, from: ['q0'], to: [] } },
      { index: 2, title: 'Step 3', explanation: 'Ex 3', data: { kind: 'simulate' as const, from: ['q0'], to: [] } },
    ];

    render(<StepLog steps={steps} currentStep={0} />);
    
    // More specific check: look for the step count in the summary
    expect(screen.getByText(/Show steps \(3\)/i)).toBeInTheDocument();
  });

  it('should render current step content', () => {
    const steps = [
      {
        index: 0,
        title: 'Start Configuration',
        explanation: 'Initial state setup',
        data: { kind: 'simulate' as const, from: ['q0'], to: [] },
      },
      {
        index: 1,
        title: 'Read symbol a',
        explanation: 'Transition on a',
        data: { kind: 'simulate' as const, from: ['q0'], to: ['q1'], symbol: 'a' },
      },
    ];

    render(<StepLog steps={steps} currentStep={1} />);
    
    expect(screen.getByText('Read symbol a')).toBeInTheDocument();
    expect(screen.getByText('Transition on a')).toBeInTheDocument();
  });
});
