"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiVersioningConfig = exports.DEFAULT_API_VERSION = exports.API_VERSION_HEADER = exports.API_VERSION_METADATA_KEY = void 0;
exports.createVersionedResponse = createVersionedResponse;
exports.API_VERSION_METADATA_KEY = 'api:version';
exports.API_VERSION_HEADER = 'X-API-Version';
exports.DEFAULT_API_VERSION = '1';
function createVersionedResponse(data, version = exports.DEFAULT_API_VERSION, options) {
    const response = {
        version,
        data,
    };
    if (options?.deprecated) {
        response.meta = {
            deprecated: true,
            deprecationDate: options.deprecationDate?.toISOString(),
            deprecationMessage: options.deprecationMessage,
        };
    }
    return response;
}
class ApiVersioningConfig {
    static parseVersion(requestHeader) {
        if (!requestHeader) {
            return exports.DEFAULT_API_VERSION;
        }
        const version = requestHeader.trim().toLowerCase();
        if (version.startsWith('v')) {
            return version.slice(1);
        }
        return version;
    }
    static validateVersion(version, supportedVersions) {
        return supportedVersions.includes(version);
    }
    static isDeprecated(version, deprecatedVersions) {
        return deprecatedVersions.includes(version);
    }
}
exports.ApiVersioningConfig = ApiVersioningConfig;
ApiVersioningConfig.DEFAULT_VERSION = exports.DEFAULT_API_VERSION;
ApiVersioningConfig.HEADER = exports.API_VERSION_HEADER;
