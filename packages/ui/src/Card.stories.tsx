import type { Meta, StoryObj } from '@storybook/react';
import { Card, ContentCard, HeroCard } from './web-components';

const meta: Meta<typeof Card> = {
  title: 'Components/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    padding: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    padding: 'md',
    children: (
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Card Title</h3>
        <p className="text-gray-400">This is a basic card with default padding.</p>
      </div>
    ),
  },
};

export const NoPadding: Story = {
  args: {
    padding: 'none',
    children: (
      <div className="p-6">
        <h3 className="text-lg font-semibold text-white mb-2">No Padding Card</h3>
        <p className="text-gray-400">Padding controlled externally.</p>
      </div>
    ),
  },
};

export const SmallPadding: Story = {
  args: {
    padding: 'sm',
    children: (
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Small Padding</h3>
        <p className="text-gray-400">Compact card with small padding.</p>
      </div>
    ),
  },
};

export const LargePadding: Story = {
  args: {
    padding: 'lg',
    children: (
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Large Padding</h3>
        <p className="text-gray-400">Spacious card with large padding.</p>
      </div>
    ),
  },
};

export const Clickable: Story = {
  args: {
    padding: 'md',
    onClick: () => alert('Card clicked!'),
    children: (
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Clickable Card</h3>
        <p className="text-gray-400">Click this card to trigger an action.</p>
      </div>
    ),
  },
};

// ContentCard Stories
export const ContentCardStory: StoryObj = {
  name: 'ContentCard',
  render: () => (
    <div className="w-80">
      <ContentCard
        title="Sample Content"
        description="A brief description of the content item."
        thumbnail="https://via.placeholder.com/400x225"
        universe="movies"
      />
    </div>
  ),
};

export const ContentCardPremium: StoryObj = {
  name: 'ContentCard (Premium)',
  render: () => (
    <div className="w-80">
      <ContentCard
        title="Premium Content"
        description="Exclusive premium content for subscribers."
        thumbnail="https://via.placeholder.com/400x225"
        universe="reality"
        isPremium
      />
    </div>
  ),
};

// HeroCard Stories
export const HeroCardStory: StoryObj = {
  name: 'HeroCard',
  render: () => (
    <div className="w-full max-w-2xl">
      <HeroCard
        title="Featured Title"
        subtitle="Original Series"
        description="An exciting journey through uncharted territories with compelling characters and stunning visuals."
        thumbnail="https://via.placeholder.com/800x450"
        universe="movies"
        isLive
        isPremium
        onPlay={() => alert('Play clicked!')}
      />
    </div>
  ),
};
