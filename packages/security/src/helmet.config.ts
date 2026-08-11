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

/**
 * Progressive tightening (`security_helmet_strict`): strict=true applies the
 * full lockdown defaults; strict=false relaxes the most intrusive headers
 * (CSP, COEP, frame embedding) so teams can onboard first and tighten later
 * without code changes.
 */
export function createHelmetConfig(
  config: SecurityHeadersConfig = defaultSecurityHeadersConfig,
  strict = true
): ReturnType<typeof helmet> {
  const effective: SecurityHeadersConfig = strict
    ? config
    : {
        ...config,
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: false,
        xFrameOptions: false,
        originAgentCluster: false,
      };

  const helmetConfig: Record<string, unknown> = {
    contentSecurityPolicy: effective.contentSecurityPolicy
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
    hsts: effective.hstsMaxAge
      ? {
          maxAge: effective.hstsMaxAge,
          includeSubDomains: true,
          preload: true,
        }
      : false,
    crossOriginEmbedderPolicy: effective.crossOriginEmbedderPolicy,
    crossOriginOpenerPolicy: effective.crossOriginOpenerPolicy ? 'same-origin' : false,
    crossOriginResourcePolicy: effective.crossOriginResourcePolicy
      ? { policy: 'same-origin' }
      : false,
    originAgentCluster: !!effective.originAgentCluster,
    referrerPolicy: { policy: effective.referrerPolicy || 'strict-origin-when-cross-origin' },
    xssFilter: effective.xssProtection,
    noSniff: effective.xContentTypeOptions,
    xDnsPrefetchControl: { allow: !!effective.xDnsPrefetchControl },
    frameguard: effective.xFrameOptions ? { action: 'deny' } : false,
    xPermittedCrossDomainPolicies: {
      permittedPolicies: effective.xPermittedCrossDomainPolicies ? 'all' : 'none',
    },
    hidePoweredBy: !effective.xPoweredBy,
  };
  return helmet(helmetConfig as Parameters<typeof helmet>[0]);
}

export { helmet };
