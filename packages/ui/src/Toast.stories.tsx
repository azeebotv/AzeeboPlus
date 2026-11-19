import type { Meta, StoryObj } from '@storybook/react';
import { ToastProvider, useToast } from './Toast';

const meta: Meta = {
  title: 'Feedback/Toast',
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <ToastProvider>
        <Story />
      </ToastProvider>
    ),
  ],
};

export default meta;

function ToastDemo() {
  const toast = useToast();

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={() => toast.success('Operation successful', 'Your changes have been saved.')}
        className="px-4 py-2 text-sm font-medium text-az-surface-root bg-az-success-500 rounded-lg hover:bg-az-success-600 transition-colors"
      >
        Success Toast
      </button>
      <button
        onClick={() => toast.error('Operation failed', 'Please try again later.')}
        className="px-4 py-2 text-sm font-medium text-white bg-az-error-600 rounded-lg hover:bg-az-error-700 transition-colors"
      >
        Error Toast
      </button>
      <button
        onClick={() => toast.warning('Warning', 'Your session will expire soon.')}
        className="px-4 py-2 text-sm font-medium text-az-surface-root bg-az-warning-500 rounded-lg hover:bg-az-warning-600 transition-colors"
      >
        Warning Toast
      </button>
      <button
        onClick={() => toast.info('Information', 'A new version is available.')}
        className="px-4 py-2 text-sm font-medium text-white bg-az-primary-500 rounded-lg hover:bg-az-primary-600 transition-colors"
      >
        Info Toast
      </button>
    </div>
  );
}

export const Default: StoryObj = {
  render: () => <ToastDemo />,
};

export const LongDuration: StoryObj = {
  render: function LongDurationDemo() {
    const toast = useToast();
    return (
      <button
        onClick={() => toast.info('Persistent Toast', 'This will stay for 10 seconds.', 10000)}
        className="px-4 py-2 text-sm font-medium text-white bg-az-primary-500 rounded-lg hover:bg-az-primary-600 transition-colors"
      >
        Show Long Toast
      </button>
    );
  },
};

export const NoAutoDismiss: StoryObj = {
  render: function NoAutoDismissDemo() {
    const toast = useToast();
    return (
      <button
        onClick={() => toast.warning('Manual Dismiss', 'Click X to close.', 0)}
        className="px-4 py-2 text-sm font-medium text-az-surface-root bg-az-warning-500 rounded-lg hover:bg-az-warning-600 transition-colors"
      >
        Show Persistent Toast
      </button>
    );
  },
};
