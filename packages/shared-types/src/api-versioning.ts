export const API_VERSION_METADATA_KEY = 'api:version';

export interface ApiVersionOptions {
  version: string | number;
  isDefault?: boolean;
  deprecated?: boolean;
  deprecationDate?: Date;
  deprecationMessage?: string;
}

export const API_VERSION_HEADER = 'X-API-Version';
export const DEFAULT_API_VERSION = '1';

export interface VersionedResponse<T> {
  version: string;
  data: T;
  meta?: {
    deprecated?: boolean;
    deprecationDate?: string;
    deprecationMessage?: string;
  };
}

export function createVersionedResponse<T>(
  data: T,
  version: string = DEFAULT_API_VERSION,
  options?: {
    deprecated?: boolean;
    deprecationDate?: Date;
    deprecationMessage?: string;
  }
): VersionedResponse<T> {
  const response: VersionedResponse<T> = {
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

export class ApiVersioningConfig {
  static readonly DEFAULT_VERSION = DEFAULT_API_VERSION;
  static readonly HEADER = API_VERSION_HEADER;

  static parseVersion(requestHeader: string | undefined): string {
    if (!requestHeader) {
      return DEFAULT_API_VERSION;
    }
    const version = requestHeader.trim().toLowerCase();
    if (version.startsWith('v')) {
      return version.slice(1);
    }
    return version;
  }

  static validateVersion(version: string, supportedVersions: string[]): boolean {
    return supportedVersions.includes(version);
  }

  static isDeprecated(version: string, deprecatedVersions: string[]): boolean {
    return deprecatedVersions.includes(version);
  }
}
