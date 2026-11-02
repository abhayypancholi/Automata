/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Stepper } from './Stepper';

describe('Stepper', () => {
  it('should disable prev at first step', () => {
    const onStepChange = vi.fn();
    render(
      <Stepper
        currentStep={0}
        totalSteps={5}
        onStepChange={onStepChange}
        isPlaying={false}
        onPlayPause={vi.fn()}
      />
    );

    const prevButton = screen.getByRole('button', { name: /previous/i });
    expect(prevButton).toBeDisabled();
  });

  it('should disable next at last step', () => {
    const onStepChange = vi.fn();
    render(
      <Stepper
        currentStep={4}
        totalSteps={5}
        onStepChange={onStepChange}
        isPlaying={false}
        onPlayPause={vi.fn()}
      />
    );

    const nextButton = screen.getByRole('button', { name: /next/i });
    expect(nextButton).toBeDisabled();
  });

  it('should call onStepChange when clicking next', () => {
    const onStepChange = vi.fn();
    render(
      <Stepper
        currentStep={1}
        totalSteps={5}
        onStepChange={onStepChange}
        isPlaying={false}
        onPlayPause={vi.fn()}
      />
    );

    const nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton);

    expect(onStepChange).toHaveBeenCalledWith(2);
  });

  it('should call onStepChange when clicking prev', () => {
    const onStepChange = vi.fn();
    render(
      <Stepper
        currentStep={2}
        totalSteps={5}
        onStepChange={onStepChange}
        isPlaying={false}
        onPlayPause={vi.fn()}
      />
    );

    const prevButton = screen.getByRole('button', { name: /previous/i });
    fireEvent.click(prevButton);

    expect(onStepChange).toHaveBeenCalledWith(1);
  });

  it('should show play when not playing', () => {
    render(
      <Stepper
        currentStep={0}
        totalSteps={5}
        onStepChange={vi.fn()}
        isPlaying={false}
        onPlayPause={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
  });

  it('should show pause when playing', () => {
    render(
      <Stepper
        currentStep={0}
        totalSteps={5}
        onStepChange={vi.fn()}
        isPlaying={true}
        onPlayPause={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
  });

  it('should disable play at last step', () => {
    render(
      <Stepper
        currentStep={4}
        totalSteps={5}
        onStepChange={vi.fn()}
        isPlaying={false}
        onPlayPause={vi.fn()}
      />
    );

    const playButton = screen.getByRole('button', { name: /play/i });
    expect(playButton).toBeDisabled();
  });
});
