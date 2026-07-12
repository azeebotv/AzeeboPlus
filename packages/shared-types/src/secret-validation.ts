import { validateEnvironment, EnvValidationError } from './env-validation';

const log = (service: string, level: 'info' | 'warn' | 'error', message: string) => {
  const prefix = `[${service}]`;
  if (level === 'error') console.error(prefix, message);
  else if (level === 'warn') console.warn(prefix, message);
  else console.log(prefix, message);
};

/**
 * Validates environment variables at service startup.
 * Logs warnings for non-critical missing variables and exits for critical ones.
 *
 * @param env - The environment variables object (usually process.env)
 * @param service - The name of the service being validated
 * @param options - Validation options
 */
export function validateStartup(
  env: Record<string, string | undefined>,
  service: string,
  options: { requireAll?: boolean } = {}
): void {
  const { requireAll = false } = options;

  log(service, 'info', 'Validating environment variables...');

  try {
    validateEnvironment(env);
    log(service, 'info', 'Environment validation passed');
  } catch (error) {
    if (error instanceof EnvValidationError) {
      if (requireAll || error.missing.length > 0) {
        log(service, 'error', 'Environment validation failed:');
        if (error.missing.length > 0) {
          log(service, 'error', `  Missing required variables: ${error.missing.join(', ')}`);
        }
        if (error.invalid.length > 0) {
          log(service, 'error', `  Invalid variables: ${error.invalid.join(', ')}`);
        }
        process.exit(1);
      } else {
        log(service, 'warn', 'Environment validation warnings:');
        if (error.missing.length > 0) {
          log(service, 'warn', `  Missing optional variables: ${error.missing.join(', ')}`);
        }
        if (error.invalid.length > 0) {
          log(service, 'warn', `  Invalid variables: ${error.invalid.join(', ')}`);
        }
      }
    } else {
      log(service, 'error', `Unexpected validation error: ${error}`);
      process.exit(1);
    }
  }
}

/**
 * Checks if a secret looks like a placeholder value.
 *
 * @param value - The secret value to check
 * @returns true if the value appears to be a placeholder
 */
export function isPlaceholderSecret(value: string): boolean {
  const placeholderPatterns = [
    /^your[_-].*$/i,
    /^change[_-]?me.*$/i,
    /^replace[_-]?me.*$/i,
    /^example.*$/i,
    /^xxx+$/i,

    /^placeholder.*$/i,
    /^dummy.*$/i,
    /^test[_-].*$/i,
    /^secret[_-].*$/i,
    /^password.*$/i,
    /^key[_-].*$/i,
    /^token[_-].*$/i,
  ];

  return placeholderPatterns.some((pattern) => pattern.test(value));
}

/**
 * Validates that no placeholder secrets are in use.
 *
 * @param env - The environment variables object
 * @param secretKeys - List of keys that should contain real secrets
 * @returns Array of keys that contain placeholder values
 */
export function validateNoPlaceholders(
  env: Record<string, string | undefined>,
  secretKeys: string[]
): string[] {
  const placeholders: string[] = [];

  for (const key of secretKeys) {
    const value = env[key];
    if (value && isPlaceholderSecret(value)) {
      placeholders.push(key);
    }
  }

  return placeholders;
}
