import type { Meta, StoryObj } from '@storybook/react';
import { ShareButton } from './ShareButton';

const meta: Meta<typeof ShareButton> = {
  title: 'Web/Components/ShareButton',
  component: ShareButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    contentId: { control: 'text' },
    title: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    contentId: 'cnt00001-0000-0000-0000-000000000029',
    title: 'Lion Heart',
  },
};

export const Music: Story = {
  args: {
    contentId: 'cnt00001-0000-0000-0000-000000000050',
    title: 'Last Last - Burna Boy',
  },
};

export const Creator: Story = {
  args: {
    contentId: 'cre-001',
    title: 'Mark Angel Comedy',
  },
};
