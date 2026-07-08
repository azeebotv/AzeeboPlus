/** NestJS module that provides global validation and sanitization pipes. */
export { ValidationModule } from './validation.module';

/** Interceptor that sanitizes outgoing response payloads. */
export { SanitizeOutputInterceptor } from './pipes/sanitize-output.interceptor';

/** Validator decorator that enforces strong password requirements. */
export { IsStrongPassword } from './validators/password.validator';

/** Validator decorator that checks for valid email format. */
export { IsValidEmail } from './validators/email.validator';

/** Validator decorator that checks for valid phone number format. */
export { IsValidPhone } from './validators/phone.validator';

/** Validator decorator that enforces username format and character rules. */
export { IsValidUsername } from './validators/username.validator';

/** Validator decorator that checks for valid URL format. */
export { IsValidUrl } from './validators/url.validator';
