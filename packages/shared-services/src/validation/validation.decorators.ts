import {
  IsString,
  IsNumber,
  IsEmail,
  IsBoolean,
  IsOptional,
  IsNotEmpty,
  Min,
  Max,
  Length,
  Matches,
  IsUUID,
  IsDate,
  IsEnum,
  ValidateIf,
  ArrayMinSize,
  ArrayMaxSize,
  IsArray,
  IsIn,
} from 'class-validator';

export {
  IsString,
  IsNumber,
  IsEmail,
  IsBoolean,
  IsOptional,
  IsNotEmpty,
  Min,
  Max,
  Length,
  Matches,
  IsUUID,
  IsDate,
  IsEnum,
  ValidateIf,
  ArrayMinSize,
  ArrayMaxSize,
  IsArray,
  IsIn,
};

export const IsPhoneNumber = () =>
  Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Must be a valid phone number',
  });

export const IsPassword = () =>
  Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
    message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
  });

export const IsUsername = () =>
  Matches(/^[a-zA-Z0-9_]{3,20}$/, {
    message: 'Username must be 3-20 characters, letters, numbers, and underscores only',
  });

export const IsSlug = () =>
  Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be lowercase letters, numbers, and hyphens only',
  });

export const IsUrl = () =>
  Matches(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/, {
    message: 'Must be a valid URL',
  });

export const IsCurrencyCode = () =>
  IsIn(['NGN', 'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'], {
    message: 'Must be a valid ISO 4217 currency code',
  });

export const IsStatus = () =>
  IsIn(['active', 'inactive', 'pending', 'completed', 'failed', 'cancelled'], {
    message: 'Must be a valid status',
  });

export const MinPaymentAmount = (min: number = 100) => Min(min, {
  message: `Amount must be at least ${min}`,
});

export const MaxPaymentAmount = (max: number = 1000000) => Max(max, {
  message: `Amount must not exceed ${max}`,
});