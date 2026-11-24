import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { EmptyState } from '../EmptyState';

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(<EmptyState title="No content" description="Check back later" />);
    expect(screen.getByText('No content')).toBeInTheDocument();
    expect(screen.getByText('Check back later')).toBeInTheDocument();
  });

  it('renders with custom icon', () => {
    render(<EmptyState title="No results" description="Try different search" icon="search" />);
    expect(screen.getByText('No results')).toBeInTheDocument();
  });

  it('renders action button when provided', () => {
    const onClick = vi.fn();
    render(
      <EmptyState
        title="Empty library"
        description="Start browsing"
        action={{ label: 'Browse', onClick }}
      />
    );
    expect(screen.getByText('Browse')).toBeInTheDocument();
  });

  it('calls action handler when button clicked', () => {
    const onClick = vi.fn();
    render(
      <EmptyState
        title="Empty"
        description="Nothing here"
        action={{ label: 'Click me', onClick }}
      />
    );
    screen.getByText('Click me').click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('applies custom className', () => {
    const { container } = render(
      <EmptyState title="Test" description="Test" className="custom-class" />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
