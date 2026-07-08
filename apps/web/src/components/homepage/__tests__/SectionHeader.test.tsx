import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SectionHeader from '@/components/homepage/SectionHeader';

describe('SectionHeader', () => {
  it('renders the title', () => {
    render(<SectionHeader title="Trending Now" />);
    expect(screen.getByText('Trending Now')).toBeInTheDocument();
  });

  it('renders the subtitle when provided', () => {
    render(<SectionHeader title="Trending Now" subtitle="Popular content this week" />);
    expect(screen.getByText('Trending Now')).toBeInTheDocument();
    expect(screen.getByText('Popular content this week')).toBeInTheDocument();
  });

  it('does not render subtitle when not provided', () => {
    render(<SectionHeader title="Trending Now" />);
    expect(screen.queryByText('Popular content this week')).not.toBeInTheDocument();
  });
});
