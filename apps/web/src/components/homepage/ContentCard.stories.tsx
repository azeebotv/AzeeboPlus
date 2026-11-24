import type { Meta, StoryObj } from '@storybook/react';
import ContentCard from './ContentCard';

const mockContentItem = {
  id: 'cnt00001-0000-0000-0000-000000000029',
  title: 'Lion Heart',
  description: 'A young woman takes over her family business after her father falls ill.',
  thumbnail: '/images/placeholders/content/800x450_29.png',
  universe: 'movies' as const,
  duration: 120,
  rating: 4.5,
  type: 'movie' as const,
  year: 2018,
  maturityRating: 'PG-13',
  isPremium: false,
};

const meta: Meta<typeof ContentCard> = {
  title: 'Web/Homepage/ContentCard',
  component: ContentCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    item: mockContentItem,
    sectionId: 'trending',
    position: 0,
    size: 'md',
  },
};

export const Small: Story = {
  args: {
    item: { ...mockContentItem, title: 'Last Last', universe: 'music' as const },
    sectionId: 'music-trending',
    position: 0,
    size: 'sm',
  },
};

export const WithProgress: Story = {
  args: {
    item: mockContentItem,
    sectionId: 'continue-watching',
    position: 0,
    progress: 65,
    showProgress: true,
  },
};
