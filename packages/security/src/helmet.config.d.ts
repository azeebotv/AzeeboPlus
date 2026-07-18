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
export declare const defaultSecurityHeadersConfig: SecurityHeadersConfig;
import helmet from 'helmet';
export declare function createHelmetConfig(config?: SecurityHeadersConfig): ReturnType<typeof helmet>;
export { helmet };
