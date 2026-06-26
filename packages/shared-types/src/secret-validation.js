"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateStartup = validateStartup;
exports.isPlaceholderSecret = isPlaceholderSecret;
exports.validateNoPlaceholders = validateNoPlaceholders;
const env_validation_1 = require("./env-validation");
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
//# sourceMappingURL=secret-validation.js.map