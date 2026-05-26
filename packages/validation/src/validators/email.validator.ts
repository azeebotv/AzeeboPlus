import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsValidEmail(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidEmail',
      target: object.constructor,
      propertyName,
      options: {
        message: 'Please provide a valid email address',
        ...validationOptions,
      },
      validator: {
        validate(value: string): boolean {
          if (typeof value !== 'string') return false;
          const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
          return emailRegex.test(value);
        },
      },
    });
  };
}
