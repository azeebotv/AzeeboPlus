import type { Meta, StoryObj } from '@storybook/react';
import { Skeleton } from './Skeleton';

const meta: Meta<typeof Skeleton> = {
  title: 'Web/Components/Skeleton',
  component: Skeleton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    width: { control: 'text' },
    height: { control: 'text' },
    variant: { control: 'select', options: ['text', 'circular', 'rectangular'] },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    width: '200px',
    height: '20px',
  },
};

export const CardSkeleton: Story = {
  render: () => (
    <div className="w-[300px] space-y-4 p-4 rounded-lg bg-surface">
      <Skeleton width="100%" height="180px" />
      <Skeleton width="80%" height="20px" />
      <Skeleton width="60%" height="16px" />
    </div>
  ),
};

export const ListSkeleton: Story = {
  render: () => (
    <div className="w-[400px] space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-surface">
          <Skeleton width="48px" height="48px" variant="circular" />
          <div className="flex-1 space-y-2">
            <Skeleton width="70%" height="16px" />
            <Skeleton width="50%" height="14px" />
          </div>
        </div>
      ))}
    </div>
  ),
};

export const ContentGrid: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="space-y-2">
          <Skeleton width="100%" height="120px" variant="rectangular" />
          <Skeleton width="80%" height="14px" />
          <Skeleton width="60%" height="12px" />
        </div>
      ))}
    </div>
  ),
};
