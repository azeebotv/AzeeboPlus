"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateStartup = validateStartup;
exports.isPlaceholderSecret = isPlaceholderSecret;
exports.validateNoPlaceholders = validateNoPlaceholders;
/* eslint-disable no-console */
const env_validation_1 = require("./env-validation");
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
    console.log(`[${service}] Validating environment variables...`);
    try {
        (0, env_validation_1.validateEnvironment)(env);
        console.log(`[${service}] Environment validation passed`);
    }
    catch (error) {
        if (error instanceof env_validation_1.EnvValidationError) {
            if (requireAll || error.missing.length > 0) {
                console.error(`[${service}] Environment validation failed:`);
                if (error.missing.length > 0) {
                    console.error(`  Missing required variables: ${error.missing.join(', ')}`);
                }
                if (error.invalid.length > 0) {
                    console.error(`  Invalid variables: ${error.invalid.join(', ')}`);
                }
                process.exit(1);
            }
            else {
                console.warn(`[${service}] Environment validation warnings:`);
                if (error.missing.length > 0) {
                    console.warn(`  Missing optional variables: ${error.missing.join(', ')}`);
                }
                if (error.invalid.length > 0) {
                    console.warn(`  Invalid variables: ${error.invalid.join(', ')}`);
                }
            }
        }
        else {
            console.error(`[${service}] Unexpected validation error:`, error);
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
        /^test.*$/i,
        /^dummy.*$/i,
        /^secret.*$/i,
        /^password.*$/i,
        /^key.*$/i,
        /^token.*$/i,
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
