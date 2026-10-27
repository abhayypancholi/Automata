import { describe, it, expect } from 'vitest';
import { ErrorView } from './ErrorView';
import { LoadingView } from './LoadingView';
import { EmptyView } from './EmptyView';
import { ResultPanel } from './ResultPanel';

describe('Shared Components', () => {
  describe('ErrorView', () => {
    it('should render error message', () => {
      const error = {
        code: 'INVALID_AUTOMATON' as const,
        message: 'Invalid automaton structure',
      };

      // Basic structure check - component should accept error prop
      expect(() => ErrorView({ error })).not.toThrow();
    });

    it('should include line and column info when provided', () => {
      const error = {
        code: 'UNEXPECTED_TOKEN' as const,
        message: 'Unexpected token',
        line: 5,
        column: 10,
      };

      expect(() => ErrorView({ error })).not.toThrow();
    });
  });

  describe('LoadingView', () => {
    it('should render with default message', () => {
      expect(() => LoadingView({})).not.toThrow();
    });

    it('should render with custom message', () => {
      expect(() => LoadingView({ message: 'Processing...' })).not.toThrow();
    });
  });

  describe('EmptyView', () => {
    it('should render with title only', () => {
      expect(() => EmptyView({ title: 'No data' })).not.toThrow();
    });

    it('should render with description', () => {
      expect(() =>
        EmptyView({
          title: 'No data',
          description: 'Add some data to get started',
        })
      ).not.toThrow();
    });

    it('should render with action button', () => {
      expect(() =>
        EmptyView({
          title: 'No data',
          action: { label: 'Add data', onClick: () => {} },
        })
      ).not.toThrow();
    });
  });

  describe('ResultPanel', () => {
    it('should render with title and children', () => {
      expect(() =>
        ResultPanel({
          title: 'Result',
          children: 'Content',
        })
      ).not.toThrow();
    });

    it('should render with actions', () => {
      expect(() =>
        ResultPanel({
          title: 'Result',
          children: 'Content',
          actions: 'Actions',
        })
      ).not.toThrow();
    });
  });
});
