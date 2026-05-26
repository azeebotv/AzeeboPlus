import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './web-components';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'outline'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    disabled: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    size: 'md',
    children: 'Primary Button',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    size: 'md',
    children: 'Secondary Button',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    size: 'md',
    children: 'Ghost Button',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    size: 'md',
    children: 'Outline Button',
  },
};

export const Small: Story = {
  args: {
    variant: 'primary',
    size: 'sm',
    children: 'Small Button',
  },
};

export const Large: Story = {
  args: {
    variant: 'primary',
    size: 'lg',
    children: 'Large Button',
  },
};

export const Disabled: Story = {
  args: {
    variant: 'primary',
    size: 'md',
    disabled: true,
    children: 'Disabled Button',
  },
};

export const WithIcon: Story = {
  args: {
    variant: 'primary',
    size: 'md',
    children: 'With Icon',
    leftIcon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    ),
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4 items-center">
      <Button variant="primary" size="md">Primary</Button>
      <Button variant="secondary" size="md">Secondary</Button>
      <Button variant="ghost" size="md">Ghost</Button>
      <Button variant="outline" size="md">Outline</Button>
      <Button variant="primary" size="md" disabled>Disabled</Button>
    </div>
  ),
};
