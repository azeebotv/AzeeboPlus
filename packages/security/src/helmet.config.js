"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.helmet = exports.defaultSecurityHeadersConfig = void 0;
exports.createHelmetConfig = createHelmetConfig;
exports.defaultSecurityHeadersConfig = {
    hstsMaxAge: 31536000,
    contentSecurityPolicy: true,
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: true,
    originAgentCluster: true,
    referrerPolicy: 'strict-origin-when-cross-origin',
    xssProtection: true,
    xContentTypeOptions: true,
    xDnsPrefetchControl: true,
    xDownloadOptions: true,
    xFrameOptions: true,
    xPermittedCrossDomainPolicies: true,
    xPoweredBy: true,
    xXssProtection: true,
};
const helmet_1 = __importDefault(require("helmet"));
exports.helmet = helmet_1.default;
function createHelmetConfig(config = exports.defaultSecurityHeadersConfig) {
    const helmetConfig = {
        contentSecurityPolicy: config.contentSecurityPolicy
            ? {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'"],
                    styleSrc: ["'self'"],
                    imgSrc: ["'self'", 'data:', 'https:'],
                    fontSrc: ["'self'", 'https:'],
                    objectSrc: ["'none'"],
                    upgradeInsecureRequests: [],
                },
            }
            : false,
        hsts: config.hstsMaxAge
            ? {
                maxAge: config.hstsMaxAge,
                includeSubDomains: true,
                preload: true,
            }
            : false,
        crossOriginEmbedderPolicy: config.crossOriginEmbedderPolicy,
        crossOriginOpenerPolicy: config.crossOriginOpenerPolicy ? 'same-origin' : false,
        crossOriginResourcePolicy: config.crossOriginResourcePolicy ? { policy: 'same-origin' } : false,
        originAgentCluster: !!config.originAgentCluster,
        referrerPolicy: { policy: config.referrerPolicy || 'strict-origin-when-cross-origin' },
        xssFilter: config.xssProtection,
        noSniff: config.xContentTypeOptions,
        xDnsPrefetchControl: { allow: !!config.xDnsPrefetchControl },
        frameguard: config.xFrameOptions ? { action: 'deny' } : { action: 'allow' },
        xPermittedCrossDomainPolicies: {
            permittedPolicies: config.xPermittedCrossDomainPolicies ? 'all' : 'none',
        },
        hidePoweredBy: !config.xPoweredBy,
    };
    return (0, helmet_1.default)(helmetConfig);
}
//# sourceMappingURL=helmet.config.js.map