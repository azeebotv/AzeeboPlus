import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ContentCard from '@/components/homepage/ContentCard';

vi.mock('@/lib/analytics', () => ({
  default: {
    homepageCardClicked: vi.fn(),
  },
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/components/OptimizedImage', () => ({
  OptimizedImage: ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} {...props} />
  ),
}));

const mockItem = {
  id: 'test-1',
  title: 'Test Content',
  thumbnail: '/test-thumbnail.jpg',
  duration: 120,
  universe: { id: 'u1', name: 'Reality', icon: '📺' },
  creator: { id: 'c1', name: 'Test Creator' },
  mediaAsset: { thumbnailUrl: '/media-thumb.jpg' },
};

describe('ContentCard', () => {
  it('renders the content title', () => {
    render(<ContentCard item={mockItem} sectionId="trending" position={0} />);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders the thumbnail image', () => {
    render(<ContentCard item={mockItem} sectionId="trending" position={0} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('alt', 'Test Content');
  });

  it('renders creator name', () => {
    render(<ContentCard item={mockItem} sectionId="trending" position={0} />);
    expect(screen.getByText('Test Creator')).toBeInTheDocument();
  });

  it('renders duration badge', () => {
    render(<ContentCard item={mockItem} sectionId="trending" position={0} />);
    expect(screen.getByText('2:00')).toBeInTheDocument();
  });

  it('renders universe icon', () => {
    render(<ContentCard item={mockItem} sectionId="trending" position={0} />);
    expect(screen.getByText('📺')).toBeInTheDocument();
  });

  it('links to watch page', () => {
    render(<ContentCard item={mockItem} sectionId="trending" position={0} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/watch/test-1');
  });
});
