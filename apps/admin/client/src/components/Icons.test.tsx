// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { Icon } from './Icons';

describe('Icon', () => {
  afterEach(cleanup);

  it('renders a known icon by name', () => {
    const { container } = render(<Icon name="dashboard" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute('width')).toBe('18');
  });

  it('renders with custom size', () => {
    const { container } = render(<Icon name="users" size={32} />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('32');
    expect(svg?.getAttribute('height')).toBe('32');
  });

  it('renders with custom color', () => {
    const { container } = render(<Icon name="film" color="#E8420A" />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('stroke')).toBe('#E8420A');
  });

  it('maps emoji names to icon names', () => {
    const { container } = render(<Icon name="📊" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('falls back to a span for unknown icon names', () => {
    render(<Icon name="unknown-icon-name" />);
    const span = screen.getByText('unknown-icon-name');
    expect(span.tagName).toBe('SPAN');
  });

  it('applies className to the wrapper', () => {
    const { container } = render(<Icon name="search" className="my-class" />);
    const span = container.querySelector('span.my-class');
    expect(span).toBeTruthy();
  });

  it('renders all named icons without crashing', () => {
    const iconNames = [
      'dashboard', 'trending', 'users', 'film', 'checkCircle',
      'sparkles', 'book', 'theater', 'globe', 'wallet',
      'dollarSign', 'creditCard', 'refresh', 'gift', 'flame',
      'search', 'bell', 'megaphone', 'gem', 'bot',
      'clipboardList', 'shield', 'clock', 'activity', 'barChart',
      'flag', 'sliders', 'settings', 'alertTriangle', 'star',
      'chevronDown', 'chevronRight', 'chevronUp', 'x', 'menu',
      'filter', 'eye', 'plus', 'userPlus', 'logOut', 'externalLink', 'zap',
    ];

    for (const name of iconNames) {
      const { container, unmount } = render(<Icon name={name} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
      unmount();
    }
  });
});
