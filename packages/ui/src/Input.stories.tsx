import type { Meta, StoryObj } from '@storybook/react';
import { Input, Textarea, Select, Checkbox, Radio } from './Input';

const inputMeta: Meta<typeof Input> = {
  title: 'Forms/Input',
  component: Input,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'tel', 'url'],
    },
  },
};

export default inputMeta;
type InputStory = StoryObj<typeof inputMeta>;

export const InputDefault: InputStory = {
  name: 'Default',
  args: { placeholder: 'Enter text...' },
};

export const InputWithLabel: InputStory = {
  name: 'With Label',
  args: { label: 'Email address', type: 'email', placeholder: 'you@example.com' },
};

export const InputWithError: InputStory = {
  name: 'With Error',
  args: {
    label: 'Email address',
    type: 'email',
    value: 'invalid-email',
    error: 'Please enter a valid email address',
  },
};

export const InputWithHelper: InputStory = {
  name: 'With Helper Text',
  args: {
    label: 'Username',
    placeholder: 'Choose a username',
    helperText: 'Must be 3-20 characters',
  },
};

export const InputWithIcon: InputStory = {
  name: 'With Icons',
  args: {
    label: 'Search',
    placeholder: 'Search...',
    leftIcon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
    ),
  },
};

export const InputDisabled: InputStory = {
  name: 'Disabled',
  args: { label: 'Disabled input', placeholder: 'Cannot edit', disabled: true },
};

export const InputFullWidth: InputStory = {
  name: 'Full Width',
  args: { label: 'Full width input', placeholder: 'Takes full container width', fullWidth: true },
  parameters: { layout: 'padded' },
};

// Textarea Stories
const textareaMeta: Meta<typeof Textarea> = {
  title: 'Forms/Textarea',
  component: Textarea,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};

export const TextareaDefault: StoryObj<typeof textareaMeta> = {
  name: 'Default',
  args: { label: 'Message', placeholder: 'Write your message...', rows: 4 },
};

export const TextareaWithError: StoryObj<typeof textareaMeta> = {
  name: 'With Error',
  args: {
    label: 'Bio',
    placeholder: 'Tell us about yourself',
    error: 'Bio must be at least 10 characters',
    rows: 4,
  },
};

// Select Stories
const selectMeta: Meta<typeof Select> = {
  title: 'Forms/Select',
  component: Select,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};

export const SelectDefault: StoryObj<typeof selectMeta> = {
  name: 'Default',
  args: {
    label: 'Country',
    options: [
      { value: 'us', label: 'United States' },
      { value: 'uk', label: 'United Kingdom' },
      { value: 'ca', label: 'Canada' },
      { value: 'au', label: 'Australia' },
    ],
  },
};

export const SelectWithError: StoryObj<typeof selectMeta> = {
  name: 'With Error',
  args: {
    label: 'Category',
    options: [
      { value: 'movies', label: 'Movies' },
      { value: 'games', label: 'Games' },
      { value: 'sports', label: 'Sports' },
    ],
    error: 'Please select a category',
  },
};

// Checkbox Stories
const checkboxMeta: Meta<typeof Checkbox> = {
  title: 'Forms/Checkbox',
  component: Checkbox,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};

export const CheckboxDefault: StoryObj<typeof checkboxMeta> = {
  name: 'Default',
  args: { label: 'I agree to the terms' },
};

export const CheckboxChecked: StoryObj<typeof checkboxMeta> = {
  name: 'Checked',
  args: { label: 'Remember me', defaultChecked: true },
};

export const CheckboxWithError: StoryObj<typeof checkboxMeta> = {
  name: 'With Error',
  args: { label: 'I agree to the terms', error: 'You must accept the terms' },
};

export const CheckboxGroup: StoryObj<typeof checkboxMeta> = {
  name: 'Checkbox Group',
  render: () => (
    <div className="space-y-3">
      <Checkbox label="Email notifications" />
      <Checkbox label="Push notifications" />
      <Checkbox label="SMS notifications" />
      <Checkbox label="Weekly digest" defaultChecked />
    </div>
  ),
};

// Radio Stories
const radioMeta: Meta<typeof Radio> = {
  title: 'Forms/Radio',
  component: Radio,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};

export const RadioGroup: StoryObj<typeof radioMeta> = {
  name: 'Radio Group',
  render: () => (
    <div className="space-y-3">
      <Radio name="plan" label="Free" value="free" defaultChecked />
      <Radio name="plan" label="Pro - $9/month" value="pro" />
      <Radio name="plan" label="Enterprise - $29/month" value="enterprise" />
    </div>
  ),
};
