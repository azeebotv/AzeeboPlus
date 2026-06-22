import type { Meta, StoryObj } from '@storybook/react';
import { Icon } from './Icon';

const meta: Meta<typeof Icon> = {
  title: 'Components/Icon',
  component: Icon,
  tags: ['autodocs'],
  argTypes: {
    name: {
      control: 'select',
      options: [
        'Home',
        'User',
        'Settings',
        'Search',
        'Mail',
        'Bell',
        'Heart',
        'Star',
        'ChevronRight',
        'ChevronLeft',
        'ChevronUp',
        'ChevronDown',
        'Plus',
        'X',
        'Edit',
        'Trash2',
        'Download',
        'Upload',
        'Play',
        'Pause',
        'Volume2',
        'VolumeX',
        'Check',
        'AlertCircle',
        'Info',
        'Warning',
        'Lock',
        'Unlock',
        'Eye',
        'EyeOff',
        'Share2',
        'MessageSquare',
        'Phone',
        'MapPin',
        'Calendar',
        'Clock',
        'Wallet',
        'CreditCard',
      ],
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl', '2xl'],
    },
    color: {
      control: 'color',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Icon>;

export const Default: Story = {
  args: {
    name: 'Home',
    size: 'md',
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4 p-4">
      <Icon name="Home" size="xs" />
      <Icon name="Home" size="sm" />
      <Icon name="Home" size="md" />
      <Icon name="Home" size="lg" />
      <Icon name="Home" size="xl" />
      <Icon name="Home" size="2xl" />
    </div>
  ),
};

export const Colors: Story = {
  render: () => (
    <div className="flex items-center gap-4 p-4">
      <Icon name="Heart" color="#ef4444" />
      <Icon name="Star" color="#f59e0b" />
      <Icon name="Check" color="#22c55e" />
      <Icon name="Info" color="#3b82f6" />
      <Icon name="AlertCircle" color="#f97316" />
    </div>
  ),
};

export const CommonIcons: Story = {
  render: () => (
    <div className="grid grid-cols-4 gap-4 p-4">
      {['Home', 'User', 'Settings', 'Search', 'Mail', 'Bell', 'Heart', 'Star'].map((icon) => (
        <div key={icon} className="flex flex-col items-center gap-2 p-2">
          <Icon name={icon as any} size="lg" />
          <span className="text-xs text-text-tertiary">{icon}</span>
        </div>
      ))}
    </div>
  ),
};
