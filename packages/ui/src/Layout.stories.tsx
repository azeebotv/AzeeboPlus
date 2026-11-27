import type { Meta, StoryObj } from '@storybook/react';
import {
  Container,
  Grid,
  GridItem,
  Stack,
  Responsive,
  AspectRatio,
  Split,
  DashboardLayout,
  AuthLayout,
  PageHeader,
} from './Layout';
import { Button, Card, Badge } from './web-components';

const meta: Meta = {
  title: 'Components/Layout',
  tags: ['autodocs'],
};

export default meta;

// Container
export const ContainerComponent: StoryObj<typeof Container> = {
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', '2xl', 'full'],
    },
  },
  args: {
    size: 'lg',
  },
  render: (args) => (
    <div className="bg-az-surface-root p-4">
      <Container {...args}>
        <Card>
          <p>This is a container with max-width: {args.size}</p>
        </Card>
      </Container>
    </div>
  ),
};

// Grid
export const GridComponent: StoryObj<typeof Grid> = {
  args: {
    cols: { base: 1, sm: 2, md: 3, lg: 4 },
    gap: { base: '4', md: '6' },
  },
  render: (args) => (
    <div className="p-4">
      <Grid {...args}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} padding="sm">
            <p>Card {i}</p>
          </Card>
        ))}
      </Grid>
    </div>
  ),
};

// GridItem
export const GridItemComponent: StoryObj<typeof GridItem> = {
  render: () => (
    <div className="p-4">
      <Grid cols={{ base: 2, md: 4 }}>
        <GridItem>
          <Card padding="sm">Normal</Card>
        </GridItem>
        <GridItem span={{ base: 2 }}>
          <Card padding="sm">Full width on mobile</Card>
        </GridItem>
        <GridItem>
          <Card padding="sm">Normal</Card>
        </GridItem>
        <GridItem>
          <Card padding="sm">Normal</Card>
        </GridItem>
        <GridItem span={{ md: 2 }}>
          <Card padding="sm">2 columns on md+</Card>
        </GridItem>
      </Grid>
    </div>
  ),
};

// Stack
export const StackComponent: StoryObj<typeof Stack> = {
  argTypes: {
    direction: {
      control: 'select',
      options: ['horizontal', 'vertical'],
    },
    align: {
      control: 'select',
      options: ['start', 'center', 'end', 'stretch'],
    },
    justify: {
      control: 'select',
      options: ['start', 'center', 'end', 'between', 'around', 'evenly'],
    },
    wrap: {
      control: 'boolean',
    },
  },
  args: {
    direction: 'horizontal',
    align: 'center',
    justify: 'start',
    wrap: false,
  },
  render: (args) => (
    <div className="p-4 bg-az-surface-raised rounded-xl">
      <Stack {...args}>
        <Button>Button 1</Button>
        <Button variant="secondary">Button 2</Button>
        <Button variant="outline">Button 3</Button>
      </Stack>
    </div>
  ),
};

// Responsive
export const ResponsiveComponent: StoryObj<typeof Responsive> = {
  render: () => (
    <div className="p-4">
      <Responsive showOnlyOn="sm">
        <Badge variant="outline">Visible on small screens</Badge>
      </Responsive>
      <Responsive showOnlyOn="md">
        <Badge variant="success">Visible on medium screens</Badge>
      </Responsive>
      <Responsive showOnlyOn="lg">
        <Badge variant="warning">Visible on large screens</Badge>
      </Responsive>
    </div>
  ),
};

// AspectRatio
export const AspectRatioComponent: StoryObj<typeof AspectRatio> = {
  argTypes: {
    ratio: {
      control: 'select',
      options: ['square', 'video', 'portrait', 'banner', 'wide', 'ultrawide'],
    },
  },
  args: {
    ratio: 'video',
  },
  render: (args) => (
    <div className="p-4">
      <AspectRatio {...args}>
        <div className="w-full h-full bg-gradient-to-br from-az-primary-500 to-az-secondary-500 flex items-center justify-center">
          <span className="text-white font-semibold">{args.ratio}</span>
        </div>
      </AspectRatio>
    </div>
  ),
};

// Split
export const SplitComponent: StoryObj<typeof Split> = {
  argTypes: {
    ratio: {
      control: 'select',
      options: ['50/50', '60/40', '40/60', '70/30', '30/70'],
    },
    reverseOnMobile: {
      control: 'boolean',
    },
  },
  args: {
    ratio: '50/50',
    reverseOnMobile: false,
  },
  render: (args) => (
    <div className="p-4">
      <Split
        {...args}
        left={
          <Card padding="lg">
            <h3 className="font-semibold mb-2">Left Content</h3>
            <p className="text-sm text-az-ink-dim">This is the left section of the split layout.</p>
          </Card>
        }
        right={
          <Card padding="lg">
            <h3 className="font-semibold mb-2">Right Content</h3>
            <p className="text-sm text-az-ink-dim">
              This is the right section of the split layout.
            </p>
          </Card>
        }
      />
    </div>
  ),
};

// DashboardLayout
export const DashboardLayoutComponent: StoryObj<typeof DashboardLayout> = {
  args: {
    sidebarCollapsed: false,
  },
  render: (args) => (
    <DashboardLayout
      {...args}
      sidebar={
        <div className="space-y-2">
          <Button variant="ghost" className="w-full justify-start">
            Dashboard
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            Analytics
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            Settings
          </Button>
        </div>
      }
      header={<div className="p-4">Header Content</div>}
      footer={<div className="text-center text-sm text-az-ink-muted">Footer Content</div>}
      onSidebarToggle={() => {}}
    >
      <div className="space-y-4">
        <Card>
          <h2 className="text-xl font-semibold mb-4">Welcome to Dashboard</h2>
          <p>This is the main content area of the dashboard layout.</p>
        </Card>
      </div>
    </DashboardLayout>
  ),
};

// AuthLayout
export const AuthLayoutComponent: StoryObj<typeof AuthLayout> = {
  render: () => (
    <AuthLayout
      logo={<span className="text-2xl font-bold text-az-primary-400">Azeebo+</span>}
      footer="© 2026 Azeebo+. All rights reserved."
    >
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-center">Welcome Back</h2>
        <div className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            className="w-full px-4 py-2 rounded-lg border border-az-glass-border bg-az-surface-root"
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-2 rounded-lg border border-az-glass-border bg-az-surface-root"
          />
        </div>
        <Button className="w-full">Sign In</Button>
      </div>
    </AuthLayout>
  ),
};

// PageHeader
export const PageHeaderComponent: StoryObj<typeof PageHeader> = {
  args: {
    title: 'Settings',
    subtitle: 'Manage your account settings',
  },
  render: (args) => (
    <div className="p-4">
      <PageHeader {...args} actions={<Button>Save Changes</Button>} />
    </div>
  ),
};
