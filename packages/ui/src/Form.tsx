'use client';

import React from 'react';
import { useForm, UseFormProps, Controller, FieldValues, Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ZodType, ZodError, type z } from 'zod';
import { Input, Textarea, Select, Checkbox, Radio } from './Input';
import { Button } from './web-components';

export type FormSchema<T extends FieldValues> = ZodType<T>;

export interface FormProps<T extends FieldValues> extends Omit<UseFormProps<T>, 'resolver'> {
  schema?: FormSchema<T>;
  children: (form: {
    register: ReturnType<typeof useForm<T>>['register'];
    control: ReturnType<typeof useForm<T>>['control'];
    handleSubmit: ReturnType<typeof useForm<T>>['handleSubmit'];
    formState: ReturnType<typeof useForm<T>>['formState'];
    errors: ReturnType<typeof useForm<T>>['formState']['errors'];
  }) => React.ReactNode;
  onSubmit: (data: T) => void;
}

export function Form<T extends FieldValues>({
  schema,
  children,
  onSubmit,
  ...props
}: FormProps<T>) {
  const form = useForm<T>({
    ...props,
    resolver: schema ? (zodResolver(schema as any) as any) : undefined,
  });

  const { register, control, handleSubmit, formState } = form;
  const { errors } = formState;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {children({ register, control, handleSubmit, formState, errors })}
    </form>
  );
}

export interface FieldProps<T extends FieldValues> {
  name: Path<T>;
  label?: string;
  control: ReturnType<typeof useForm<T>>['control'];
  rules?: object;
  children?: React.ReactNode;
  className?: string;
}

export function Field<T extends FieldValues>({
  name,
  label,
  control,
  rules,
  children,
  className = '',
}: FieldProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState: { error } }) => {
        const inputProps = {
          ...field,
          id: String(name),
          error: error?.message,
        };

        if (children) {
          return React.cloneElement(children as React.ReactElement, {
            ...inputProps,
            className,
          });
        }

        return (
          <Input {...inputProps} label={label} className={className} />
        );
      }}
    />
  );
}

export interface FormFieldProps {
  label?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}

export function FormField({ label, error, className = '', children }: FormFieldProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}
      {children}
      {error && (
        <p className="text-sm text-error-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export interface FormButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  type?: 'submit' | 'button' | 'reset';
  children: React.ReactNode;
  isSubmitting?: boolean;
}

export function FormButton({
  type = 'submit',
  children,
  isSubmitting,
  disabled,
  ...props
}: FormButtonProps) {
  return (
    <Button
      type={type}
      isLoading={isSubmitting}
      disabled={disabled || isSubmitting}
      {...props}
    >
      {children}
    </Button>
  );
}

export interface FormErrorMessageProps {
  error?: { message?: string };
  className?: string;
}

export function FormErrorMessage({ error, className = '' }: FormErrorMessageProps) {
  if (!error?.message) return null;

  return (
    <p className={`text-sm text-error-400 ${className}`} role="alert">
      {error.message}
    </p>
  );
}

export interface FormErrorMessageListProps {
  errors: { [key: string]: { message?: string } };
  className?: string;
}

export function FormErrorMessageList({ errors, className = '' }: FormErrorMessageListProps) {
  const errorMessages = Object.values(errors)
    .filter((error) => error.message)
    .map((error) => error.message);

  if (errorMessages.length === 0) return null;

  return (
    <ul className={`space-y-1 ${className}`}>
      {errorMessages.map((message, index) => (
        <li key={index} className="text-sm text-error-400" role="alert">
          {message}
        </li>
      ))}
    </ul>
  );
}

export function useFormValidation<T extends FieldValues>(schema: FormSchema<T>) {
  const form = useForm<T>({
    resolver: zodResolver(schema as any) as any,
  });

  return form;
}

export function getZodErrorMessage(error: ZodError): string {
  return error.issues[0]?.message || 'Validation error';
}