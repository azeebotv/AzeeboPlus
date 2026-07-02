export declare const API_VERSION_METADATA_KEY = 'api:version';
export interface ApiVersionOptions {
  version: string | number;
  isDefault?: boolean;
  deprecated?: boolean;
  deprecationDate?: Date;
  deprecationMessage?: string;
}
export declare const API_VERSION_HEADER = 'X-API-Version';
export declare const DEFAULT_API_VERSION = '1';
export interface VersionedResponse<T> {
  version: string;
  data: T;
  meta?: {
    deprecated?: boolean;
    deprecationDate?: string;
    deprecationMessage?: string;
  };
}
export declare function createVersionedResponse<T>(
  data: T,
  version?: string,
  options?: {
    deprecated?: boolean;
    deprecationDate?: Date;
    deprecationMessage?: string;
  }
): VersionedResponse<T>;
export declare class ApiVersioningConfig {
  static readonly DEFAULT_VERSION = '1';
  static readonly HEADER = 'X-API-Version';
  static parseVersion(requestHeader: string | undefined): string;
  static validateVersion(version: string, supportedVersions: string[]): boolean;
  static isDeprecated(version: string, deprecatedVersions: string[]): boolean;
}
