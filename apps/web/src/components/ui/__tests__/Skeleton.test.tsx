import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Skeleton, SkeletonCard, SkeletonList } from '../Skeleton';

describe('Skeleton', () => {
  it('renders with default props', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders with custom width and height', () => {
    const { container } = render(<Skeleton width="200px" height="20px" />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders text variant', () => {
    const { container } = render(<Skeleton variant="text" />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders circular variant', () => {
    const { container } = render(<Skeleton variant="circular" />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders rectangular variant', () => {
    const { container } = render(<Skeleton variant="rectangular" />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Skeleton className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});

describe('SkeletonCard', () => {
  it('renders', () => {
    const { container } = render(<SkeletonCard />);
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('SkeletonList', () => {
  it('renders with default count', () => {
    const { container } = render(<SkeletonList />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders with custom count', () => {
    const { container } = render(<SkeletonList count={5} />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
