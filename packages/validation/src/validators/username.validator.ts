import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsValidUsername(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidUsername',
      target: object.constructor,
      propertyName,
      options: {
        message: 'Username must be 3-30 characters, alphanumeric and underscores only',
        ...validationOptions,
      },
      validator: {
        validate(value: string): boolean {
          if (typeof value !== 'string') return false;
          const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
          return usernameRegex.test(value);
        },
      },
    });
  };
}
