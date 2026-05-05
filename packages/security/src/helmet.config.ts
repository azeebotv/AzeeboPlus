export interface SecurityHeadersConfig {
  hstsMaxAge?: number;
  contentSecurityPolicy?: boolean;
  crossOriginEmbedderPolicy?: boolean;
  crossOriginOpenerPolicy?: boolean;
  crossOriginResourcePolicy?: boolean;
  originAgentCluster?: boolean;
  referrerPolicy?: string;
  xssProtection?: boolean;
  xContentTypeOptions?: boolean;
  xDnsPrefetchControl?: boolean;
  xDownloadOptions?: boolean;
  xFrameOptions?: boolean;
  xPermittedCrossDomainPolicies?: boolean;
  xPoweredBy?: boolean;
  xXssProtection?: boolean;
}

export const defaultSecurityHeadersConfig: SecurityHeadersConfig = {
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

import helmet from 'helmet';

export function createHelmetConfig(config: SecurityHeadersConfig = defaultSecurityHeadersConfig) {
  return helmet({
    contentSecurityPolicy: config.contentSecurityPolicy ? {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        fontSrc: ["'self'", 'https:'],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    } : false,
    hsts: config.hstsMaxAge ? {
      maxAge: config.hstsMaxAge,
      includeSubDomains: true,
      preload: true,
    } : false,
    crossOriginEmbedderPolicy: config.crossOriginEmbedderPolicy,
    crossOriginOpenerPolicy: config.crossOriginOpenerPolicy ? 'same-origin' : false,
    crossOriginResourcePolicy: config.crossOriginResourcePolicy ? { policy: 'same-origin' } : false,
    originAgentCluster: config.originAgentCluster ? true : false,
    referrerPolicy: { policy: config.referrerPolicy || 'strict-origin-when-cross-origin' },
    xssFilter: config.xssProtection ? true : false,
    noSniff: config.xContentTypeOptions ? true : false,
    xDnsPrefetchControl: { allow: config.xDnsPrefetchControl ? true : false },
    xDownloadOptions: config.xDownloadOptions ? { allow: true } : false,
    frameguard: config.xFrameOptions ? { action: 'deny' } : false,
    xPermittedCrossDomainPolicies: config.xPermittedCrossDomainPolicies ? { policy: 'none' } : false,
    hidePoweredBy: config.xPoweredBy ? false : true,
  });
}

export { helmet };
