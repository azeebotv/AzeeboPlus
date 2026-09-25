import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StarRating } from '../StarRating';

describe('StarRating', () => {
  it('renders with default props', () => {
    const { container } = render(<StarRating rating={3} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders correct number of stars', () => {
    const { container } = render(<StarRating rating={4} maxRating={5} />);
    const stars = container.querySelectorAll('svg');
    expect(stars.length).toBe(5);
  });

  it('renders with custom maxRating', () => {
    const { container } = render(<StarRating rating={8} maxRating={10} />);
    const stars = container.querySelectorAll('svg');
    expect(stars.length).toBe(10);
  });

  it('calls onRate when interactive and clicked', () => {
    const onRate = vi.fn();
    render(<StarRating rating={0} interactive onRate={onRate} />);
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[2]);
    expect(onRate).toHaveBeenCalledWith(3);
  });

  it('does not call onRate when not interactive', () => {
    const onRate = vi.fn();
    const { container } = render(<StarRating rating={3} onRate={onRate} />);
    // Non-interactive stars are just SVGs, not buttons
    const stars = container.querySelectorAll('svg');
    if (stars.length > 0) {
      fireEvent.click(stars[0]);
    }
    expect(onRate).not.toHaveBeenCalled();
  });

  it('shows value when showValue is true', () => {
    render(<StarRating rating={4.5} showValue />);
    expect(screen.getByText('4.5')).toBeInTheDocument();
  });

  it('does not show value by default', () => {
    render(<StarRating rating={4.5} />);
    expect(screen.queryByText('4.5')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<StarRating rating={3} className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
