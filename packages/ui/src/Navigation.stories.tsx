import type { Meta, StoryObj } from '@storybook/react';
import { Tabs, TabPanel, Breadcrumbs, Pagination, BottomNavigation, Dropdown } from './Navigation';
import { Button } from './web-components';

const meta: Meta = {
  title: 'Components/Navigation',
  tags: ['autodocs'],
};

export default meta;

// Tabs
export const TabsComponent: StoryObj<typeof Tabs> = {
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'pills', 'underline'],
    },
    fullWidth: {
      control: 'boolean',
    },
  },
  render: () => (
    <div className="p-4">
      <Tabs
        tabs={[
          { id: 'tab1', label: 'Tab 1', badge: 3 },
          { id: 'tab2', label: 'Tab 2' },
          { id: 'tab3', label: 'Tab 3', disabled: true },
        ]}
        variant="default"
      >
        <TabPanel tabId="tab1">Content for Tab 1</TabPanel>
        <TabPanel tabId="tab2">Content for Tab 2</TabPanel>
        <TabPanel tabId="tab3">Content for Tab 3</TabPanel>
      </Tabs>
    </div>
  ),
};

// Breadcrumbs
export const BreadcrumbsComponent: StoryObj<typeof Breadcrumbs> = {
  args: {
    items: [
      { label: 'Home', href: '#' },
      { label: 'Products', href: '#' },
      { label: 'Electronics', href: '#' },
      { label: 'Smartphones' },
    ],
  },
  render: (args) => (
    <div className="p-4">
      <Breadcrumbs {...args} />
    </div>
  ),
};

// Pagination
export const PaginationComponent: StoryObj<typeof Pagination> = {
  argTypes: {
    showFirstLast: {
      control: 'boolean',
    },
  },
  args: {
    currentPage: 3,
    totalPages: 10,
    showFirstLast: true,
  },
  render: (args) => (
    <div className="p-4">
      <Pagination {...args} onPageChange={() => {}} />
    </div>
  ),
};

// Bottom Navigation
export const BottomNavigationComponent: StoryObj<typeof BottomNavigation> = {
  args: {
    items: [
      { id: 'home', label: 'Home', icon: 'Home', active: true },
      { id: 'search', label: 'Search', icon: 'Search' },
      { id: 'add', label: 'Add', icon: 'Plus', badge: 2 },
      { id: 'notifications', label: 'Notifications', icon: 'Bell', badge: '99+' },
      { id: 'profile', label: 'Profile', icon: 'User' },
    ],
    activeItem: 'home',
  },
  render: (args) => (
    <div className="p-4 bg-az-surface-root" style={{ height: '200px' }}>
      <BottomNavigation {...args} onItemPress={() => {}} />
    </div>
  ),
};

// Dropdown
export const DropdownComponent: StoryObj<typeof Dropdown> = {
  argTypes: {
    align: {
      control: 'select',
      options: ['left', 'right'],
    },
  },
  args: {
    align: 'left',
    items: [
      { id: 'item1', label: 'New File', icon: 'FilePlus', shortcut: 'Ctrl+N' },
      { id: 'item2', label: 'Open', icon: 'FolderOpen', shortcut: 'Ctrl+O' },
      { id: 'divider1', label: '', divider: true },
      { id: 'item3', label: 'Save', icon: 'Save', shortcut: 'Ctrl+S' },
      { id: 'item4', label: 'Save As...', icon: 'Download', shortcut: 'Ctrl+Shift+S' },
      { id: 'divider2', label: '', divider: true },
      { id: 'item5', label: 'Settings', icon: 'Settings' },
      { id: 'item6', label: 'Help', icon: 'HelpCircle', disabled: true },
    ],
  },
  render: (args) => (
    <div className="p-4">
      <Dropdown {...args} trigger={<Button>Menu</Button>} />
    </div>
  ),
};
