import type { Meta, StoryObj } from '@storybook/react';
import { Badge, Avatar, Skeleton, Divider } from './web-components';

const badgeMeta: Meta<typeof Badge> = {
  title: 'Components/Badge',
  component: Badge,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'success', 'error', 'warning', 'outline'],
    },
  },
};

export default badgeMeta;
type BadgeStory = StoryObj<typeof badgeMeta>;

export const BadgePrimary: BadgeStory = {
  name: 'Primary',
  args: { variant: 'primary', children: 'Primary' },
};

export const BadgeSecondary: BadgeStory = {
  name: 'Secondary',
  args: { variant: 'secondary', children: 'Secondary' },
};

export const BadgeSuccess: BadgeStory = {
  name: 'Success',
  args: { variant: 'success', children: 'Success' },
};

export const BadgeError: BadgeStory = {
  name: 'Error',
  args: { variant: 'error', children: 'Error' },
};

export const BadgeWarning: BadgeStory = {
  name: 'Warning',
  args: { variant: 'warning', children: 'Warning' },
};

export const BadgeOutline: BadgeStory = {
  name: 'Outline',
  args: { variant: 'outline', children: 'Outline' },
};

export const AllBadges: BadgeStory = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="primary">Primary</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="error">Error</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="outline">Outline</Badge>
    </div>
  ),
};

// Avatar Stories
const avatarMeta: Meta<typeof Avatar> = {
  title: 'Components/Avatar',
  component: Avatar,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'medium', 'lg'],
    },
  },
};

export const AvatarDefault: StoryObj<typeof avatarMeta> = {
  name: 'Default',
  args: { fallback: 'JD' },
};

export const AvatarSmall: StoryObj<typeof avatarMeta> = {
  name: 'Small',
  args: { size: 'sm', fallback: 'JD' },
};

export const AvatarLarge: StoryObj<typeof avatarMeta> = {
  name: 'Large',
  args: { size: 'lg', fallback: 'JD' },
};

export const AvatarWithImage: StoryObj<typeof avatarMeta> = {
  name: 'With Image',
  args: {
    size: 'lg',
    src: 'https://via.placeholder.com/48',
    fallback: 'JD',
  },
};

export const AllSizes: StoryObj<typeof avatarMeta> = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar size="sm" fallback="SM" />
      <Avatar size="md" fallback="MD" />
      <Avatar size="lg" fallback="LG" />
    </div>
  ),
};

// Skeleton Stories
const skeletonMeta: Meta<typeof Skeleton> = {
  title: 'Components/Skeleton',
  component: Skeleton,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};

export const SkeletonDefault: StoryObj<typeof skeletonMeta> = {
  name: 'Default',
  args: { width: '200px', height: '16px' },
};

export const SkeletonCircle: StoryObj<typeof skeletonMeta> = {
  name: 'Circle',
  args: { width: '48px', height: '48px', borderRadius: '50%' },
};

export const SkeletonCard: StoryObj<typeof skeletonMeta> = {
  name: 'Card Loading State',
  render: () => (
    <div className="w-80 space-y-3">
      <Skeleton width="100%" height="180px" borderRadius="12px" />
      <Skeleton width="80%" height="20px" />
      <Skeleton width="60%" height="16px" />
      <Skeleton width="40%" height="16px" />
    </div>
  ),
};

// Divider Stories
const dividerMeta: Meta<typeof Divider> = {
  title: 'Components/Divider',
  component: Divider,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};

export const DividerDefault: StoryObj<typeof dividerMeta> = {
  name: 'Default',
  render: () => (
    <div className="w-80 space-y-4">
      <p className="text-white">Content above</p>
      <Divider />
      <p className="text-white">Content below</p>
    </div>
  ),
};
