"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VERSIONS = exports.ApiVersion = exports.API_VERSION_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.API_VERSION_KEY = 'api_version';
const ApiVersion = (version) => (0, common_1.SetMetadata)(exports.API_VERSION_KEY, version);
exports.ApiVersion = ApiVersion;
exports.VERSIONS = {
    V1: '1',
    V2: '2',
};
