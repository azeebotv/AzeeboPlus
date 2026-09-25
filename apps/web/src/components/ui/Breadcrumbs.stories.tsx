import type { Meta, StoryObj } from '@storybook/react';
import { Breadcrumbs } from './Breadcrumbs';

const meta: Meta<typeof Breadcrumbs> = {
  title: 'Web/Components/Breadcrumbs',
  component: Breadcrumbs,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    items: [
      { label: 'Home', href: '/' },
      { label: 'Movies', href: '/movies' },
      { label: 'Lion Heart' },
    ],
  },
};

export const DeepNesting: Story = {
  args: {
    items: [
      { label: 'Home', href: '/' },
      { label: 'Universes', href: '/universes' },
      { label: 'Music', href: '/music' },
      { label: 'Artists', href: '/music/artists' },
      { label: 'Burna Boy' },
    ],
  },
};

export const SingleLevel: Story = {
  args: {
    items: [{ label: 'Home', href: '/' }, { label: 'Profile' }],
  },
};
