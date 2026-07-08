import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Skeleton, CardSkeleton, ContentGridSkeleton } from '@/components/Skeleton';

describe('Skeleton', () => {
  it('renders with default props', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Skeleton className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('applies custom width and height', () => {
    const { container } = render(<Skeleton width="200px" height="50px" />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.width).toBe('200px');
    expect(el.style.height).toBe('50px');
  });
});

describe('CardSkeleton', () => {
  it('renders without errors', () => {
    const { container } = render(<CardSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('ContentGridSkeleton', () => {
  it('renders default number of cards', () => {
    const { container } = render(<ContentGridSkeleton />);
    const cards = container.querySelectorAll('[style*="border-radius: 12px"]');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('renders custom number of cards', () => {
    const { container } = render(<ContentGridSkeleton count={3} />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
