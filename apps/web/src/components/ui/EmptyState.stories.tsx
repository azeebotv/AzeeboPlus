import type { Meta, StoryObj } from '@storybook/react';
import { EmptyState } from './EmptyState';

const meta: Meta<typeof EmptyState> = {
  title: 'Web/Components/EmptyState',
  component: EmptyState,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'No content available',
    description: 'Check back later for new content.',
  },
};

export const WithAction: Story = {
  args: {
    title: 'Your library is empty',
    description: 'Start browsing to add movies and shows.',
  },
};

export const SearchEmpty: Story = {
  args: {
    title: 'No results found',
    description: 'Try a different search term.',
  },
};

export const Downloads: Story = {
  args: {
    title: 'No downloads yet',
    description: 'Download content to watch offline.',
  },
};
