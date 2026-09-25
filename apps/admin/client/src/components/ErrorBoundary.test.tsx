// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';

function Boom(): React.ReactElement {
  throw new Error('Test crash');
}

function Safe() {
  return <div>child content</div>;
}

describe('ErrorBoundary', () => {
  afterEach(cleanup);

  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <Safe />
      </ErrorBoundary>
    );
    expect(screen.getByText('child content')).toBeTruthy();
  });

  it('renders error UI when a child throws', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );
    expect(screen.getByText('Something went wrong')).toBeTruthy();
    expect(screen.getByText('Test crash')).toBeTruthy();
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
      '[Admin ErrorBoundary]',
      expect.any(Error),
      expect.any(Object)
    );
    consoleSpy.mockRestore();
  });

  it('shows the Reload Page button', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );
    const btn = screen.getByRole('button', { name: 'Reload Page' });
    expect(btn).toBeTruthy();
    consoleSpy.mockRestore();
  });

  it('does not render children when error is thrown', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { container } = render(
      <ErrorBoundary>
        <Boom />
        <Safe />
      </ErrorBoundary>
    );
    expect(screen.queryByText('child content')).toBeNull();
    expect(container.textContent).toContain('Something went wrong');
    consoleSpy.mockRestore();
  });
});
