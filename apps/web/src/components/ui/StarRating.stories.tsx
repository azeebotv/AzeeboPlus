import type { Meta, StoryObj } from '@storybook/react';
import { StarRating } from './StarRating';

const meta: Meta<typeof StarRating> = {
  title: 'Web/Components/StarRating',
  component: StarRating,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    rating: { control: { type: 'range', min: 0, max: 5, step: 0.5 } },
    maxRating: { control: { type: 'range', min: 1, max: 10, step: 1 } },
    size: { control: { type: 'range', min: 12, max: 48, step: 4 } },
    interactive: { control: 'boolean' },
    showValue: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    rating: 4,
    maxRating: 5,
    size: 24,
  },
};

export const HalfStars: Story = {
  args: {
    rating: 3.5,
    maxRating: 5,
    size: 24,
  },
};

export const Small: Story = {
  args: {
    rating: 4.5,
    maxRating: 5,
    size: 16,
  },
};

export const Large: Story = {
  args: {
    rating: 5,
    maxRating: 5,
    size: 36,
  },
};

export const Interactive: Story = {
  args: {
    rating: 0,
    maxRating: 5,
    size: 36,
    interactive: true,
  },
};

export const TenStars: Story = {
  args: {
    rating: 8,
    maxRating: 10,
    size: 24,
  },
};
