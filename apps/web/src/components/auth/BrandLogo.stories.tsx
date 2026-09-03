import type { Meta, StoryObj } from '@storybook/react';
import BrandLogo from './BrandLogo';

const meta: Meta<typeof BrandLogo> = {
  title: 'Web/Auth/BrandLogo',
  component: BrandLogo,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['light', 'orange'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Light: Story = {
  args: {
    variant: 'light',
  },
};

export const Orange: Story = {
  args: {
    variant: 'orange',
  },
};
