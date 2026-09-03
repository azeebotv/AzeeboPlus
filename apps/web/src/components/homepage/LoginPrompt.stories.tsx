import type { Meta, StoryObj } from '@storybook/react';
import LoginPrompt from './LoginPrompt';

const meta: Meta<typeof LoginPrompt> = {
  title: 'Web/Homepage/LoginPrompt',
  component: LoginPrompt,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithReferral: Story = {
  args: {
    referralCode: 'FRIEND2024',
  },
};
