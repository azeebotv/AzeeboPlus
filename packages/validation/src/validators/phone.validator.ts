import { registerDecorator, ValidationOptions } from 'class-validator';

export function IsValidPhone(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidPhone',
      target: object.constructor,
      propertyName,
      options: {
        message: 'Please provide a valid phone number (E.164 format)',
        ...validationOptions,
      },
      validator: {
        validate(value: string): boolean {
          if (typeof value !== 'string') return false;
          const phoneRegex = /^\+[1-9]\d{1,14}$/;
          return phoneRegex.test(value);
        },
      },
    });
  };
}
