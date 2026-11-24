import type { Meta, StoryObj } from '@storybook/react';
import SectionHeader from './SectionHeader';

const meta: Meta<typeof SectionHeader> = {
  title: 'Web/Homepage/SectionHeader',
  component: SectionHeader,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Trending Now',
    subtitle: "What's hot right now",
  },
};

export const WithoutSubtitle: Story = {
  args: {
    title: 'Continue Watching',
  },
};

export const WithCount: Story = {
  args: {
    title: 'Recently Watched',
    subtitle: '12 items',
  },
};
