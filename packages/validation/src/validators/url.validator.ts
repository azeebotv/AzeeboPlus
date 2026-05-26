import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsValidUrl(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidUrl',
      target: object.constructor,
      propertyName,
      options: {
        message: 'Please provide a valid URL',
        ...validationOptions,
      },
      validator: {
        validate(value: string): boolean {
          if (typeof value !== 'string') return false;
          try {
            const url = new URL(value);
            return url.protocol === 'http:' || url.protocol === 'https:';
          } catch {
            return false;
          }
        },
      },
    });
  };
}
