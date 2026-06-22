import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Modal, ConfirmDialog } from './Modal';

const meta: Meta<typeof Modal> = {
  title: 'Overlays/Modal',
  component: Modal,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', 'full'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    isOpen: true,
    title: 'Modal Title',
    description: 'This is a description of the modal content.',
    children: (
      <p className="text-text-secondary">
        Modal body content goes here. You can include forms, text, or any other components.
      </p>
    ),
    footer: (
      <div className="flex justify-end gap-3">
        <button className="px-4 py-2 text-sm font-medium text-text-primary bg-bg-secondary border border-border-default rounded-lg hover:bg-bg-tertiary transition-colors">
          Cancel
        </button>
        <button className="px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors">
          Save
        </button>
      </div>
    ),
  },
};

export const Small: Story = {
  args: {
    ...Default.args,
    size: 'sm',
    title: 'Small Modal',
    description: 'A compact modal for simple confirmations.',
    children: <p className="text-text-secondary">Are you sure you want to proceed?</p>,
  },
};

export const Large: Story = {
  args: {
    ...Default.args,
    size: 'lg',
    title: 'Large Modal',
    children: (
      <div className="space-y-4">
        <p className="text-text-secondary">This modal has more space for complex content.</p>
        <div className="p-4 bg-bg-tertiary rounded-lg">
          <p className="text-sm text-text-secondary">Additional information panel</p>
        </div>
      </div>
    ),
  },
};

export const WithoutHeader: Story = {
  args: {
    isOpen: true,
    children: (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-500/20 flex items-center justify-center">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-primary-400"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-text-primary mb-2">Success!</h3>
        <p className="text-text-secondary">Your changes have been saved.</p>
      </div>
    ),
  },
};

export const NoCloseOnOverlay: Story = {
  args: {
    ...Default.args,
    closeOnOverlayClick: false,
    title: 'Important Action',
    description: 'You must use the buttons to close this modal.',
  },
};

// ConfirmDialog Stories
export const ConfirmDialogDefault: StoryObj = {
  name: 'ConfirmDialog',
  render: () => {
    const [isOpen, setIsOpen] = useState(true);
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors"
        >
          Open Confirm Dialog
        </button>
        <ConfirmDialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onConfirm={() => alert('Confirmed!')}
          title="Delete Item"
          description="Are you sure you want to delete this item? This action cannot be undone."
          confirmLabel="Delete"
        />
      </>
    );
  },
};

export const ConfirmDialogDanger: StoryObj = {
  name: 'ConfirmDialog (Danger)',
  render: () => {
    const [isOpen, setIsOpen] = useState(true);
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-error-500 rounded-lg hover:bg-error-600 transition-colors"
        >
          Delete Account
        </button>
        <ConfirmDialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onConfirm={() => alert('Account deleted!')}
          title="Delete Account"
          description="This will permanently delete your account and all associated data."
          confirmLabel="Delete Account"
          variant="danger"
        />
      </>
    );
  },
};
