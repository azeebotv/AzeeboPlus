#!/usr/bin/env node

/**
 * Azeebo+ Documentation Sync Tool
 *
 * Automatically synchronizes documentation with the codebase by:
 * - Scanning service directories for API endpoints
 * - Extracting service metadata from package.json files
 * - Generating/updating API documentation
 * - Creating service dependency graphs
 * - Validating documentation consistency
 */

import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';
import * as yaml from 'js-yaml';

interface ServiceInfo {
  name: string;
  path: string;
  category: string;
  description: string;
  version: string;
  endpoints: EndpointInfo[];
  dependencies: string[];
}

interface EndpointInfo {
  method: string;
  path: string;
  description: string;
  auth: boolean;
  rateLimit?: string;
}

interface SyncConfig {
  servicesDir: string;
  docsDir: string;
  outputFormat: 'markdown' | 'json' | 'both';
  includeExamples: boolean;
  generateGraphs: boolean;
  validateConsistency: boolean;
}

class DocumentationSync {
  private config: SyncConfig;
  private services: ServiceInfo[] = [];

  constructor(configPath: string = './docs-sync.config.json') {
    this.config = this.loadConfig(configPath);
  }

  private loadConfig(configPath: string): SyncConfig {
    const defaultConfig: SyncConfig = {
      servicesDir: './services',
      docsDir: './docs',
      outputFormat: 'both',
      includeExamples: true,
      generateGraphs: true,
      validateConsistency: true,
    };

    try {
      if (fs.existsSync(configPath)) {
        const configData = fs.readFileSync(configPath, 'utf-8');
        return { ...defaultConfig, ...JSON.parse(configData) };
      }
    } catch (error) {
      console.warn('Warning: Could not load config file, using defaults');
    }

    return defaultConfig;
  }

  async sync(): Promise<void> {
    console.log('🔄 Starting documentation sync...\n');

    // Scan all services
    await this.scanServices();

    // Generate documentation
    await this.generateServiceDocs();
    await this.generateApiDocs();
    await this.generateDependencyGraph();
    await this.generateServiceCatalog();

    // Validate consistency
    if (this.config.validateConsistency) {
      await this.validateDocumentation();
    }

    console.log('\n✅ Documentation sync completed successfully!');
  }

  private async scanServices(): Promise<void> {
    console.log('📂 Scanning services...');

    const serviceDirs = [
      'core',
      'universes',
      'engagement',
      'operations',
      'intelligence',
      'gateway',
    ];

    for (const category of serviceDirs) {
      const categoryPath = path.join(this.config.servicesDir, category);

      if (!fs.existsSync(categoryPath)) {
        continue;
      }

      const services = fs.readdirSync(categoryPath);

      for (const serviceName of services) {
        const servicePath = path.join(categoryPath, serviceName);
        const packageJsonPath = path.join(servicePath, 'package.json');

        if (!fs.existsSync(packageJsonPath)) {
          continue;
        }

        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        const endpoints = await this.extractEndpoints(servicePath);
        const dependencies = this.extractDependencies(packageJson);

        this.services.push({
          name: serviceName,
          path: servicePath,
          category,
          description: packageJson.description || '',
          version: packageJson.version || '1.0.0',
          endpoints,
          dependencies,
        });
      }
    }

    console.log(`   Found ${this.services.length} services\n`);
  }

  private async extractEndpoints(servicePath: string): Promise<EndpointInfo[]> {
    const endpoints: EndpointInfo[] = [];
    const controllerFiles = glob.sync('**/*.controller.ts', { cwd: servicePath });

    for (const file of controllerFiles) {
      const filePath = path.join(servicePath, file);
      const content = fs.readFileSync(filePath, 'utf-8');

      // Extract @Controller decorator
      const controllerMatch = content.match(/@Controller\(['"]([^'"]+)['"]\)/);
      const basePath = controllerMatch ? controllerMatch[1] : '';

      // Extract route decorators
      const routeRegex = /@(Get|Post|Put|Patch|Delete)\(['"]([^'"]*)['"]\)/g;
      let match;

      while ((match = routeRegex.exec(content)) !== null) {
        const method = match[1].toUpperCase();
        const route = match[2];
        const fullPath = basePath ? `/${basePath}${route}` : route;

        // Extract operation description
        const operationMatch = content
          .substring(match.index)
          .match(/@ApiOperation\({[^}]*summary:\s*['"]([^'"]+)['"]/);
        const description = operationMatch ? operationMatch[1] : '';

        // Check for authentication
        const hasAuth =
          content.includes('@UseGuards(AuthGuard') || content.includes('@UseGuards(JwtAuthGuard');

        // Check for rate limiting
        const rateLimitMatch = content.substring(match.index).match(/@RateLimit\((\d+),\s*(\d+)\)/);
        const rateLimit = rateLimitMatch
          ? `${rateLimitMatch[1]} requests per ${rateLimitMatch[2]}ms`
          : undefined;

        endpoints.push({
          method,
          path: fullPath,
          description,
          auth: hasAuth,
          rateLimit,
        });
      }
    }

    return endpoints;
  }

  private extractDependencies(packageJson: any): string[] {
    const deps: string[] = [];
    const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    for (const dep of Object.keys(allDeps)) {
      if (dep.startsWith('@azeebo/')) {
        deps.push(dep.replace('@azeebo/', ''));
      }
    }

    return deps;
  }

  private async generateServiceDocs(): Promise<void> {
    console.log('📝 Generating service documentation...');

    const servicesDir = path.join(this.config.docsDir, 'services');
    if (!fs.existsSync(servicesDir)) {
      fs.mkdirSync(servicesDir, { recursive: true });
    }

    for (const service of this.services) {
      const docPath = path.join(servicesDir, `${service.name}.md`);
      const content = this.generateServiceDocContent(service);
      fs.writeFileSync(docPath, content);
    }

    console.log(`   Generated ${this.services.length} service docs\n`);
  }

  private generateServiceDocContent(service: ServiceInfo): string {
    const lines: string[] = [];

    lines.push(`# ${service.name}`);
    lines.push('');
    lines.push(`**Category**: ${service.category}`);
    lines.push(`**Version**: ${service.version}`);
    lines.push('');
    lines.push(service.description);
    lines.push('');

    // Endpoints
    if (service.endpoints.length > 0) {
      lines.push('## API Endpoints');
      lines.push('');
      lines.push('| Method | Path | Description | Auth | Rate Limit |');
      lines.push('|--------|------|-------------|------|------------|');

      for (const endpoint of service.endpoints) {
        const auth = endpoint.auth ? '✅' : '❌';
        const rateLimit = endpoint.rateLimit || '-';
        lines.push(
          `| ${endpoint.method} | \`${endpoint.path}\` | ${endpoint.description} | ${auth} | ${rateLimit} |`
        );
      }
      lines.push('');
    }

    // Dependencies
    if (service.dependencies.length > 0) {
      lines.push('## Dependencies');
      lines.push('');
      for (const dep of service.dependencies) {
        lines.push(`- \`${dep}\``);
      }
      lines.push('');
    }

    lines.push('---');
    lines.push(`*Auto-generated on ${new Date().toISOString()}*`);

    return lines.join('\n');
  }

  private async generateApiDocs(): Promise<void> {
    console.log('📚 Generating API documentation...');

    const apiDocPath = path.join(this.config.docsDir, 'API-REFERENCE.md');
    const lines: string[] = [];

    lines.push('# Azeebo+ API Reference');
    lines.push('');
    lines.push(`*Auto-generated on ${new Date().toISOString()}*`);
    lines.push('');

    // Group by category
    const categories = ['core', 'universes', 'engagement', 'operations', 'intelligence', 'gateway'];

    for (const category of categories) {
      const categoryServices = this.services.filter((s) => s.category === category);

      if (categoryServices.length === 0) {
        continue;
      }

      lines.push(`## ${category.charAt(0).toUpperCase() + category.slice(1)} Services`);
      lines.push('');

      for (const service of categoryServices) {
        lines.push(`### ${service.name}`);
        lines.push('');
        lines.push(service.description);
        lines.push('');

        if (service.endpoints.length > 0) {
          lines.push('**Endpoints:**');
          lines.push('');
          for (const endpoint of service.endpoints) {
            const auth = endpoint.auth ? '🔒' : '';
            lines.push(
              `- \`${endpoint.method} ${endpoint.path}\` - ${endpoint.description} ${auth}`
            );
          }
          lines.push('');
        }
      }
    }

    fs.writeFileSync(apiDocPath, lines.join('\n'));
    console.log('   Generated API-REFERENCE.md\n');
  }

  private async generateDependencyGraph(): Promise<void> {
    if (!this.config.generateGraphs) {
      return;
    }

    console.log('🔗 Generating dependency graph...');

    const graphPath = path.join(this.config.docsDir, 'DEPENDENCY-GRAPH.md');
    const lines: string[] = [];

    lines.push('# Service Dependency Graph');
    lines.push('');
    lines.push(`*Auto-generated on ${new Date().toISOString()}*`);
    lines.push('');

    for (const service of this.services) {
      if (service.dependencies.length === 0) {
        continue;
      }

      lines.push(`## ${service.name}`);
      lines.push('');
      lines.push('**Depends on:**');
      lines.push('');
      for (const dep of service.dependencies) {
        lines.push(`- ${dep}`);
      }
      lines.push('');
    }

    fs.writeFileSync(graphPath, lines.join('\n'));
    console.log('   Generated DEPENDENCY-GRAPH.md\n');
  }

  private async generateServiceCatalog(): Promise<void> {
    console.log('📋 Generating service catalog...');

    const catalogPath = path.join(this.config.docsDir, 'SERVICE-CATALOG.md');
    const lines: string[] = [];

    lines.push('# Azeebo+ Service Catalog');
    lines.push('');
    lines.push(`*Auto-generated on ${new Date().toISOString()}*`);
    lines.push('');
    lines.push(`**Total Services**: ${this.services.length}`);
    lines.push('');

    // Summary table
    lines.push('## Summary');
    lines.push('');
    lines.push('| Category | Count | Services |');
    lines.push('|----------|-------|----------|');

    const categories = ['core', 'universes', 'engagement', 'operations', 'intelligence', 'gateway'];
    for (const category of categories) {
      const categoryServices = this.services.filter((s) => s.category === category);
      if (categoryServices.length > 0) {
        const serviceNames = categoryServices.map((s) => s.name).join(', ');
        lines.push(`| ${category} | ${categoryServices.length} | ${serviceNames} |`);
      }
    }
    lines.push('');

    // Detailed list
    lines.push('## Detailed List');
    lines.push('');

    for (const category of categories) {
      const categoryServices = this.services.filter((s) => s.category === category);

      if (categoryServices.length === 0) {
        continue;
      }

      lines.push(`### ${category.charAt(0).toUpperCase() + category.slice(1)}`);
      lines.push('');

      for (const service of categoryServices) {
        lines.push(`#### ${service.name}`);
        lines.push('');
        lines.push(`- **Version**: ${service.version}`);
        lines.push(`- **Endpoints**: ${service.endpoints.length}`);
        lines.push(`- **Dependencies**: ${service.dependencies.length}`);
        lines.push(`- **Description**: ${service.description}`);
        lines.push('');
      }
    }

    fs.writeFileSync(catalogPath, lines.join('\n'));
    console.log('   Generated SERVICE-CATALOG.md\n');
  }

  private async validateDocumentation(): Promise<void> {
    console.log('🔍 Validating documentation consistency...');

    const issues: string[] = [];

    // Check for services without descriptions
    for (const service of this.services) {
      if (!service.description) {
        issues.push(`⚠️  ${service.name}: Missing description in package.json`);
      }
    }

    // Check for services without endpoints
    for (const service of this.services) {
      if (service.endpoints.length === 0) {
        issues.push(`ℹ️  ${service.name}: No API endpoints found`);
      }
    }

    if (issues.length > 0) {
      console.log('\n⚠️  Validation Issues:');
      for (const issue of issues) {
        console.log(`   ${issue}`);
      }
      console.log('');
    } else {
      console.log('   ✅ All validations passed\n');
    }
  }
}

// Run the sync
const sync = new DocumentationSync();
sync.sync().catch((error) => {
  console.error('❌ Documentation sync failed:', error);
  process.exit(1);
});
