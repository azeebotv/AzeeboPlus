import type { Meta, StoryObj } from '@storybook/react';
import { Form, Field, FormField, FormButton, FormErrorMessage } from './Form';
import { Input, Textarea, Select } from './Input';
import * as z from 'zod';

const meta: Meta = {
  title: 'Components/Form',
  tags: ['autodocs'],
};

export default meta;

// Form with Zod Validation
export const FormWithValidation: StoryObj<typeof Form> = {
  render: () => (
    <div className="p-4 w-full max-w-md">
      <Form
        schema={z.object({
          email: z.string().email('Invalid email address'),
          password: z.string().min(8, 'Password must be at least 8 characters'),
          rememberMe: z.boolean().optional(),
        })}
        onSubmit={(data) => alert(JSON.stringify(data))}
      >
        {({ register, formState: { errors } }) => (
          <div className="space-y-4">
            <FormField label="Email" error={errors.email?.message}>
              <Input {...register('email')} type="email" placeholder="Enter your email" />
            </FormField>
            <FormField label="Password" error={errors.password?.message}>
              <Input {...register('password')} type="password" placeholder="Enter your password" />
            </FormField>
            <label className="flex items-center gap-2 cursor-pointer">
              <Input {...register('rememberMe')} type="checkbox" />
              <span className="text-sm">Remember me</span>
            </label>
            <FormButton type="submit">Sign In</FormButton>
          </div>
        )}
      </Form>
    </div>
  ),
};

// FormField
export const FormFieldComponent: StoryObj<typeof FormField> = {
  args: {
    label: 'Username',
    error: '',
  },
  render: (args) => (
    <div className="p-4 w-full max-w-md">
      <FormField {...args}>
        <Field name="username" label="Username" control={{} as any}>
          <Input type="text" placeholder="Enter your username" />
        </Field>
      </FormField>
    </div>
  ),
};

// FormField with Error
export const FormFieldWithError: StoryObj<typeof FormField> = {
  args: {
    label: 'Email',
    error: 'Please enter a valid email address',
  },
  render: (args) => (
    <div className="p-4 w-full max-w-md">
      <FormField {...args}>
        <Field name="email" label="Email" control={{} as any}>
          <Input type="email" placeholder="Enter your email" />
        </Field>
      </FormField>
    </div>
  ),
};

// Field Types
export const FieldTypes: StoryObj<typeof Form> = {
  render: () => (
    <div className="p-4 w-full max-w-md space-y-4">
      <Form
        schema={z.object({
          text: z.string(),
          email: z.string(),
          password: z.string(),
          number: z.string(),
          textarea: z.string(),
          select: z.string(),
        })}
        onSubmit={() => {}}
      >
        {({ register }) => (
          <>
            <FormField label="Text Input">
              <Input {...register('text')} type="text" placeholder="Regular text input" />
            </FormField>
            <FormField label="Email Input">
              <Input {...register('email')} type="email" placeholder="email@example.com" />
            </FormField>
            <FormField label="Password Input">
              <Input {...register('password')} type="password" placeholder="••••••••" />
            </FormField>
            <FormField label="Number Input">
              <Input {...register('number')} type="number" placeholder="0" />
            </FormField>
            <FormField label="Textarea">
              <Textarea {...register('textarea')} placeholder="Multi-line text input..." rows={3} />
            </FormField>
            <FormField label="Select">
              <Select
                {...register('select')}
                options={[
                  { value: 'us', label: 'United States' },
                  { value: 'ca', label: 'Canada' },
                  { value: 'uk', label: 'United Kingdom' },
                ]}
              />
            </FormField>
          </>
        )}
      </Form>
    </div>
  ),
};

// FormButton
export const FormButtonComponent: StoryObj<typeof FormButton> = {
  argTypes: {
    type: {
      control: 'select',
      options: ['submit', 'button', 'reset'],
    },
    isSubmitting: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
  },
  args: {
    type: 'submit',
    isSubmitting: false,
    disabled: false,
  },
  render: (args) => (
    <div className="p-4 space-y-3">
      <FormButton {...args}>Submit</FormButton>
    </div>
  ),
};

// FormErrorMessage
export const FormErrorMessageComponent: StoryObj<typeof FormErrorMessage> = {
  args: {
    error: { message: 'This field is required' },
  },
  render: (args) => (
    <div className="p-4">
      <FormErrorMessage {...args} />
    </div>
  ),
};

// Complex Form
export const ComplexForm: StoryObj<typeof Form> = {
  render: () => (
    <div className="p-4 w-full max-w-lg">
      <Form
        schema={z.object({
          firstName: z.string().min(2, 'First name must be at least 2 characters'),
          lastName: z.string().min(2, 'Last name must be at least 2 characters'),
          email: z.string().email('Invalid email'),
          phone: z.string().regex(/^[0-9]{10,15}$/, 'Invalid phone number'),
          country: z.string().nonempty('Please select a country'),
          terms: z.literal(true, 'You must agree to the terms'),
        })}
        onSubmit={(data) => alert(JSON.stringify(data))}
      >
        {({ register, formState: { errors } }) => (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="First Name" error={errors.firstName?.message}>
                <Input {...register('firstName')} placeholder="John" />
              </FormField>
              <FormField label="Last Name" error={errors.lastName?.message}>
                <Input {...register('lastName')} placeholder="Doe" />
              </FormField>
            </div>
            <FormField label="Email" error={errors.email?.message}>
              <Input {...register('email')} type="email" placeholder="john@example.com" />
            </FormField>
            <FormField label="Phone" error={errors.phone?.message}>
              <Input {...register('phone')} type="tel" placeholder="+1 234 567 890" />
            </FormField>
            <FormField label="Country" error={errors.country?.message}>
              <Select
                {...register('country')}
                options={[
                  { value: '', label: 'Select country' },
                  { value: 'US', label: 'United States' },
                  { value: 'CA', label: 'Canada' },
                  { value: 'UK', label: 'United Kingdom' },
                  { value: 'DE', label: 'Germany' },
                  { value: 'FR', label: 'France' },
                ]}
              />
            </FormField>
            <label className="flex items-start gap-3 cursor-pointer">
              <Input {...register('terms')} type="checkbox" />
              <span className="text-sm text-text-secondary">
                I agree to the Terms of Service and Privacy Policy
              </span>
            </label>
            {errors.terms && <FormErrorMessage error={errors.terms} />}
            <FormButton type="submit">Create Account</FormButton>
          </div>
        )}
      </Form>
    </div>
  ),
};
