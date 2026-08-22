/**
 * Container Scanning Configuration
 * INF-006: Scan Docker images for vulnerabilities
 */

export interface ContainerScanConfig {
  severity: 'critical' | 'high' | 'medium' | 'low';
  ignoreUnfixed: boolean;
  skipImages: string[];
  failOnVulnerability: boolean;
}

export const CONTAINER_SCAN_CONFIG: ContainerScanConfig = {
  severity: 'high',
  ignoreUnfixed: true,
  skipImages: [],
  failOnVulnerability: true,
};

// Dockerfile security best practices
export const DOCKERFILE_SECURITY_RULES = {
  // Run as non-root user
  nonRootUser: 'USER appuser',
  // Use specific version tags, not :latest
  specificVersionTag: true,
  // Use multi-stage builds to reduce attack surface
  multiStageBuild: true,
  // Don't store secrets in layers
  noSecretsInLayers: true,
  // Use read-only filesystem where possible
  readOnlyFilesystem: false,
  // Scan base images
  scanBaseImages: true,
} as const;

// Image naming convention for vulnerability tracking
export const IMAGE_NAMING = {
  pattern: '{registry}/{service}:{version}-{sha}',
  example: 'ghcr.io/azeebo/{service}:v1.2.3-abc1234',
  registries: [
    'ghcr.io/azeebo',
    'docker.io/azeebo',
  ],
} as const;
