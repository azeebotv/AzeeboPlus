import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Breadcrumbs } from '../Breadcrumbs';

// Mock Next.js Link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('Breadcrumbs', () => {
  it('renders breadcrumb items', () => {
    render(
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Movies', href: '/movies' },
          { label: 'Lion Heart' },
        ]}
      />
    );
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Movies')).toBeInTheDocument();
    expect(screen.getByText('Lion Heart')).toBeInTheDocument();
  });

  it('renders navigation landmark', () => {
    render(
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Page' },
        ]}
      />
    );
    expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toBeInTheDocument();
  });

  it('renders correct number of items', () => {
    const { container } = render(
      <Breadcrumbs
        items={[
          { label: 'A', href: '/' },
          { label: 'B', href: '/b' },
          { label: 'C' },
        ]}
      />
    );
    const listItems = container.querySelectorAll('li');
    expect(listItems.length).toBe(3);
  });

  it('renders separators between items', () => {
    const { container } = render(
      <Breadcrumbs
        items={[
          { label: 'A', href: '/' },
          { label: 'B', href: '/b' },
        ]}
      />
    );
    const separators = container.querySelectorAll('[aria-hidden="true"]');
    expect(separators.length).toBe(1);
  });

  it('renders last item without link', () => {
    render(
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Current Page' },
        ]}
      />
    );
    // Last item should be a span, not a link
    const currentText = screen.getByText('Current Page');
    expect(currentText.tagName).toBe('SPAN');
  });
});
