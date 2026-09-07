// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';

function Boom(): React.ReactElement {
  throw new Error('Creator crash');
}

function Safe() {
  return <div>safe child</div>;
}

describe('ErrorBoundary', () => {
  afterEach(cleanup);

  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <Safe />
      </ErrorBoundary>
    );
    expect(screen.getByText('safe child')).toBeTruthy();
  });

  it('renders error UI when a child throws', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );
    expect(screen.getByText('Something went wrong')).toBeTruthy();
    expect(screen.getByText('Creator crash')).toBeTruthy();
    expect(screen.getByText('Reload Page')).toBeTruthy();
    consoleSpy.mockRestore();
  });

  it('logs the error via componentDidCatch', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      '[Creator ErrorBoundary]',
      expect.any(Error),
      expect.any(Object)
    );
    consoleSpy.mockRestore();
  });

  it('does not render children when error is thrown', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Boom />
        <Safe />
      </ErrorBoundary>
    );
    expect(screen.queryByText('safe child')).toBeNull();
    consoleSpy.mockRestore();
  });
});
