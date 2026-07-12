/**
 * Validates environment variables at service startup.
 * Logs warnings for non-critical missing variables and exits for critical ones.
 *
 * @param env - The environment variables object (usually process.env)
 * @param service - The name of the service being validated
 * @param options - Validation options
 */
export declare function validateStartup(env: Record<string, string | undefined>, service: string, options?: {
    requireAll?: boolean;
}): void;
/**
 * Checks if a secret looks like a placeholder value.
 *
 * @param value - The secret value to check
 * @returns true if the value appears to be a placeholder
 */
export declare function isPlaceholderSecret(value: string): boolean;
/**
 * Validates that no placeholder secrets are in use.
 *
 * @param env - The environment variables object
 * @param secretKeys - List of keys that should contain real secrets
 * @returns Array of keys that contain placeholder values
 */
export declare function validateNoPlaceholders(env: Record<string, string | undefined>, secretKeys: string[]): string[];
