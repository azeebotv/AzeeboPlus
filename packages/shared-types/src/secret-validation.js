"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateStartup = validateStartup;
exports.isPlaceholderSecret = isPlaceholderSecret;
exports.validateNoPlaceholders = validateNoPlaceholders;
const env_validation_1 = require("./env-validation");
const log = (service, level, message) => {
    const prefix = `[${service}]`;
    if (level === 'error')
        process.stderr.write(`${prefix} ${message}\n`);
    else
        process.stdout.write(`${prefix} ${message}\n`);
};
/**
 * Validates environment variables at service startup.
 * Logs warnings for non-critical missing variables and exits for critical ones.
 *
 * @param env - The environment variables object (usually process.env)
 * @param service - The name of the service being validated
 * @param options - Validation options
 */
function validateStartup(env, service, options = {}) {
    const { requireAll = false } = options;
    log(service, 'info', 'Validating environment variables...');
    try {
        (0, env_validation_1.validateEnvironment)(env);
        log(service, 'info', 'Environment validation passed');
    }
    catch (error) {
        if (error instanceof env_validation_1.EnvValidationError) {
            if (requireAll || error.missing.length > 0) {
                log(service, 'error', 'Environment validation failed:');
                if (error.missing.length > 0) {
                    log(service, 'error', `  Missing required variables: ${error.missing.join(', ')}`);
                }
                if (error.invalid.length > 0) {
                    log(service, 'error', `  Invalid variables: ${error.invalid.join(', ')}`);
                }
                process.exit(1);
            }
            else {
                log(service, 'warn', 'Environment validation warnings:');
                if (error.missing.length > 0) {
                    log(service, 'warn', `  Missing optional variables: ${error.missing.join(', ')}`);
                }
                if (error.invalid.length > 0) {
                    log(service, 'warn', `  Invalid variables: ${error.invalid.join(', ')}`);
                }
            }
        }
        else {
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
function isPlaceholderSecret(value) {
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
function validateNoPlaceholders(env, secretKeys) {
    const placeholders = [];
    for (const key of secretKeys) {
        const value = env[key];
        if (value && isPlaceholderSecret(value)) {
            placeholders.push(key);
        }
    }
    return placeholders;
}
