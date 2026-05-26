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
        className="px-4 py-2 text-sm font-medium text-white bg-success-500 rounded-lg hover:bg-success-600 transition-colors"
      >
        Success Toast
      </button>
      <button
        onClick={() => toast.error('Operation failed', 'Please try again later.')}
        className="px-4 py-2 text-sm font-medium text-white bg-error-500 rounded-lg hover:bg-error-600 transition-colors"
      >
        Error Toast
      </button>
      <button
        onClick={() => toast.warning('Warning', 'Your session will expire soon.')}
        className="px-4 py-2 text-sm font-medium text-white bg-warning-500 rounded-lg hover:bg-warning-600 transition-colors"
      >
        Warning Toast
      </button>
      <button
        onClick={() => toast.info('Information', 'A new version is available.')}
        className="px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors"
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
        className="px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors"
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
        className="px-4 py-2 text-sm font-medium text-white bg-warning-500 rounded-lg hover:bg-warning-600 transition-colors"
      >
        Show Persistent Toast
      </button>
    );
  },
};
