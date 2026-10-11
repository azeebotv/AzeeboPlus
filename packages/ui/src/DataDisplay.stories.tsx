import type { Meta, StoryObj } from '@storybook/react';
import {
  Table,
  List,
  ListItem,
  CardListItem,
  DisplayBadge,
  Tag,
  ProgressRing,
  StatCard,
  EmptyState,
  Timeline,
} from './DataDisplay';
import { Button } from './web-components';

const meta: Meta = {
  title: 'Components/Data Display',
  tags: ['autodocs'],
};

export default meta;

// Table
export const TableComponent: StoryObj<typeof Table> = {
  argTypes: {
    striped: {
      control: 'boolean',
    },
    hoverable: {
      control: 'boolean',
    },
    compact: {
      control: 'boolean',
    },
  },
  render: () => {
    type UserRow = { name: string; email: string; role: string; status: string };
    const columns = [
      { key: 'name' as const, label: 'Name', sortable: true },
      { key: 'email' as const, label: 'Email', sortable: true },
      { key: 'role' as const, label: 'Role' },
      { key: 'status' as const, label: 'Status' },
    ];
    const data: UserRow[] = [
      { name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active' },
      { name: 'Jane Smith', email: 'jane@example.com', role: 'Editor', status: 'Active' },
      { name: 'Bob Johnson', email: 'bob@example.com', role: 'User', status: 'Inactive' },
      { name: 'Alice Brown', email: 'alice@example.com', role: 'User', status: 'Active' },
    ];
    return (
      <div className="p-4">
        <Table columns={columns} data={data} striped hoverable />
      </div>
    );
  },
};

// List
export const ListComponent: StoryObj<typeof List> = {
  argTypes: {
    bordered: {
      control: 'boolean',
    },
  },
  args: {
    bordered: false,
  },
  render: (args) => (
    <div className="p-4 w-72">
      <List {...args}>
        <ListItem title="Profile" description="View and edit your profile" icon="User" />
        <ListItem title="Settings" description="Manage account settings" icon="Settings" active />
        <ListItem title="Notifications" description="Update notification preferences" icon="Bell" />
        <ListItem
          title="Help & Support"
          description="Get help from our support team"
          icon="HelpCircle"
        />
      </List>
    </div>
  ),
};

// CardListItem
export const CardListItemComponent: StoryObj<typeof CardListItem> = {
  render: () => (
    <div className="p-4 w-96">
      <CardListItem
        title="Getting Started Guide"
        description="Learn how to use our platform effectively"
        icon="BookOpen"
        meta={<span>Updated 2 hours ago</span>}
      />
    </div>
  ),
};

// DisplayBadge
export const BadgeComponent: StoryObj<typeof DisplayBadge> = {
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'primary', 'success', 'warning', 'error', 'info'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md'],
    },
  },
  args: {
    variant: 'default',
    size: 'md',
  },
  render: (args) => (
    <div className="p-4 flex gap-2">
      <DisplayBadge {...args}>Default</DisplayBadge>
      <DisplayBadge {...args} variant="primary">
        Primary
      </DisplayBadge>
      <DisplayBadge {...args} variant="success">
        Success
      </DisplayBadge>
      <DisplayBadge {...args} variant="warning">
        Warning
      </DisplayBadge>
      <DisplayBadge {...args} variant="error">
        Error
      </DisplayBadge>
      <DisplayBadge {...args} variant="info">
        Info
      </DisplayBadge>
    </div>
  ),
};

// Tag
export const TagComponent: StoryObj<typeof Tag> = {
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'primary', 'success', 'warning', 'error'],
    },
    closable: {
      control: 'boolean',
    },
  },
  args: {
    variant: 'default',
    closable: true,
  },
  render: (args) => (
    <div className="p-4 flex flex-wrap gap-2">
      <Tag {...args}>React</Tag>
      <Tag {...args} variant="primary">
        TypeScript
      </Tag>
      <Tag {...args} variant="success">
        Node.js
      </Tag>
      <Tag {...args} variant="warning">
        Express
      </Tag>
      <Tag {...args} variant="error">
        Deprecated
      </Tag>
    </div>
  ),
};

// ProgressRing
export const ProgressRingComponent: StoryObj<typeof ProgressRing> = {
  argTypes: {
    progress: {
      control: 'range',
      min: 0,
      max: 100,
    },
    size: {
      control: 'range',
      min: 40,
      max: 120,
    },
  },
  args: {
    progress: 75,
    size: 80,
    label: 'Storage',
  },
  render: (args) => (
    <div className="p-4">
      <ProgressRing {...args} />
    </div>
  ),
};

// StatCard
export const StatCardComponent: StoryObj<typeof StatCard> = {
  args: {
    title: 'Total Revenue',
    value: '$12,345',
    icon: 'Wallet',
    trend: { value: 12, label: 'vs last month', positive: true },
  },
  render: (args) => (
    <div className="p-4 w-72">
      <StatCard {...args} />
    </div>
  ),
};

// EmptyState
export const EmptyStateComponent: StoryObj<typeof EmptyState> = {
  args: {
    icon: 'Inbox',
    title: 'No Items Found',
    description: 'There are no items to display. Try adding some content.',
  },
  render: (args) => (
    <div className="p-4 bg-az-surface-raised rounded-xl border border-az-glass-border">
      <EmptyState {...args} action={<Button>Add Item</Button>} />
    </div>
  ),
};

// Timeline
export const TimelineComponent: StoryObj<typeof Timeline> = {
  args: {
    items: [
      { title: 'Account created', description: 'Welcome to Azeebo+', time: '2 hours ago' },
      { title: 'Profile updated', icon: 'User', time: '1 hour ago' },
      {
        title: 'Subscription activated',
        icon: 'CreditCard',
        dotColor: 'success',
        time: '30 minutes ago',
      },
      { title: 'Payment received', icon: 'Check', dotColor: 'success', time: '15 minutes ago' },
    ],
  },
  render: (args) => (
    <div className="p-4">
      <Timeline {...args} />
    </div>
  ),
};
