#!/usr/bin/env node

/**
 * Azeebo+ Test Coverage Analyzer
 *
 * Analyzes test coverage across all services and generates reports
 */

import * as fs from 'fs';
import * as path from 'path';

interface ServiceCoverage {
  name: string;
  category: string;
  statements: number;
  branches: number;
  functions: number;
  lines: number;
  testFiles: number;
  status: 'critical' | 'warning' | 'good';
}

interface CoverageReport {
  timestamp: string;
  overall: {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
  };
  services: ServiceCoverage[];
  recommendations: string[];
}

class CoverageAnalyzer {
  private servicesDir = './services';
  private report: CoverageReport;

  constructor() {
    this.report = {
      timestamp: new Date().toISOString(),
      overall: { statements: 0, branches: 0, functions: 0, lines: 0 },
      services: [],
      recommendations: [],
    };
  }

  async analyze(): Promise<void> {
    console.log('🔍 Analyzing test coverage...\n');

    const categories = ['core', 'universes', 'engagement', 'operations', 'intelligence', 'gateway'];

    for (const category of categories) {
      const categoryPath = path.join(this.servicesDir, category);
      if (!fs.existsSync(categoryPath)) continue;

      const services = fs.readdirSync(categoryPath);

      for (const serviceName of services) {
        const servicePath = path.join(categoryPath, serviceName);
        const coverage = await this.analyzeService(serviceName, category, servicePath);

        if (coverage) {
          this.report.services.push(coverage);
          this.updateOverall(coverage);
        }
      }
    }

    this.generateRecommendations();
    this.saveReport();
    this.printSummary();
  }

  private async analyzeService(
    name: string,
    category: string,
    servicePath: string
  ): Promise<ServiceCoverage | null> {
    const packageJsonPath = path.join(servicePath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) return null;

    // Count test files
    const testFiles = this.countTestFiles(servicePath);

    // Try to get coverage from Jest
    let coverage = { statements: 0, branches: 0, functions: 0, lines: 0 };

    try {
      // Check if coverage directory exists
      const coverageDir = path.join(servicePath, 'coverage');
      if (fs.existsSync(coverageDir)) {
        const coverageSummaryPath = path.join(coverageDir, 'coverage-summary.json');
        if (fs.existsSync(coverageSummaryPath)) {
          const summary = JSON.parse(fs.readFileSync(coverageSummaryPath, 'utf-8'));
          coverage = {
            statements: summary.total.statements.pct || 0,
            branches: summary.total.branches.pct || 0,
            functions: summary.total.functions.pct || 0,
            lines: summary.total.lines.pct || 0,
          };
        }
      }
    } catch (error) {
      console.warn(`⚠️  Could not read coverage for ${name}`);
    }

    const avgCoverage =
      (coverage.statements + coverage.branches + coverage.functions + coverage.lines) / 4;

    return {
      name,
      category,
      ...coverage,
      testFiles,
      status: this.getStatus(avgCoverage, name),
    };
  }

  private countTestFiles(servicePath: string): number {
    let count = 0;

    const countFiles = (dir: string) => {
      if (!fs.existsSync(dir)) return;

      const items = fs.readdirSync(dir);
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stat = fs.statSync(itemPath);

        if (stat.isDirectory()) {
          countFiles(itemPath);
        } else if (item.includes('.spec.ts') || item.includes('.test.ts')) {
          count++;
        }
      }
    };

    countFiles(path.join(servicePath, 'src'));
    return count;
  }

  private getStatus(coverage: number, serviceName: string): 'critical' | 'warning' | 'good' {
    const criticalServices = ['auth-service', 'wallet-service', 'payment-service', 'user-service'];
    const threshold = criticalServices.includes(serviceName) ? 90 : 80;

    if (coverage < 70) return 'critical';
    if (coverage < threshold) return 'warning';
    return 'good';
  }

  private updateOverall(coverage: ServiceCoverage): void {
    this.report.overall.statements += coverage.statements;
    this.report.overall.branches += coverage.branches;
    this.report.overall.functions += coverage.functions;
    this.report.overall.lines += coverage.lines;
  }

  private generateRecommendations(): void {
    const criticalServices = this.report.services.filter((s) => s.status === 'critical');
    const warningServices = this.report.services.filter((s) => s.status === 'warning');

    if (criticalServices.length > 0) {
      this.report.recommendations.push(
        `🚨 CRITICAL: ${criticalServices.length} services have coverage below 70%:`,
        ...criticalServices.map((s) => `   - ${s.name} (${s.category})`)
      );
    }

    if (warningServices.length > 0) {
      this.report.recommendations.push(
        `\n⚠️  WARNING: ${warningServices.length} services need improvement:`,
        ...warningServices.map((s) => `   - ${s.name} (${s.category})`)
      );
    }

    // Check for services with no tests
    const noTests = this.report.services.filter((s) => s.testFiles === 0);
    if (noTests.length > 0) {
      this.report.recommendations.push(
        `\n❌ NO TESTS: ${noTests.length} services have no test files:`,
        ...noTests.map((s) => `   - ${s.name} (${s.category})`)
      );
    }

    // Overall coverage
    const avgCoverage =
      (this.report.overall.statements +
        this.report.overall.branches +
        this.report.overall.functions +
        this.report.overall.lines) /
      (this.report.services.length * 4);

    if (avgCoverage < 80) {
      this.report.recommendations.push(
        `\n📊 Overall coverage (${avgCoverage.toFixed(1)}%) is below target (80%)`
      );
    }
  }

  private saveReport(): void {
    const reportPath = './docs/COVERAGE-REPORT.json';
    fs.writeFileSync(reportPath, JSON.stringify(this.report, null, 2));
    console.log(`\n📄 Report saved to ${reportPath}`);

    // Generate markdown report
    const mdReport = this.generateMarkdownReport();
    fs.writeFileSync('./docs/COVERAGE-REPORT.md', mdReport);
    console.log(`📄 Markdown report saved to ./docs/COVERAGE-REPORT.md`);
  }

  private generateMarkdownReport(): string {
    const lines: string[] = [];

    lines.push('# Azeebo+ Test Coverage Report');
    lines.push('');
    lines.push(`*Generated: ${new Date(this.report.timestamp).toLocaleString()}*`);
    lines.push('');

    // Overall coverage
    lines.push('## Overall Coverage');
    lines.push('');
    lines.push(`- **Statements**: ${this.report.overall.statements.toFixed(1)}%`);
    lines.push(`- **Branches**: ${this.report.overall.branches.toFixed(1)}%`);
    lines.push(`- **Functions**: ${this.report.overall.functions.toFixed(1)}%`);
    lines.push(`- **Lines**: ${this.report.overall.lines.toFixed(1)}%`);
    lines.push('');

    // Services table
    lines.push('## Service Coverage');
    lines.push('');
    lines.push(
      '| Service | Category | Statements | Branches | Functions | Lines | Tests | Status |'
    );
    lines.push(
      '|---------|----------|------------|----------|-----------|-------|-------|--------|'
    );

    for (const service of this.report.services.sort((a, b) => a.name.localeCompare(b.name))) {
      const status =
        service.status === 'critical' ? '🚨' : service.status === 'warning' ? '⚠️' : '✅';
      lines.push(
        `| ${service.name} | ${service.category} | ${service.statements.toFixed(1)}% | ${service.branches.toFixed(1)}% | ${service.functions.toFixed(1)}% | ${service.lines.toFixed(1)}% | ${service.testFiles} | ${status} |`
      );
    }
    lines.push('');

    // Recommendations
    if (this.report.recommendations.length > 0) {
      lines.push('## Recommendations');
      lines.push('');
      lines.push(...this.report.recommendations);
      lines.push('');
    }

    return lines.join('\n');
  }

  private printSummary(): void {
    console.log('\n📊 Coverage Summary:');
    console.log(`   Services analyzed: ${this.report.services.length}`);
    console.log(`   Overall statements: ${this.report.overall.statements.toFixed(1)}%`);
    console.log(`   Overall branches: ${this.report.overall.branches.toFixed(1)}%`);
    console.log(`   Overall functions: ${this.report.overall.functions.toFixed(1)}%`);
    console.log(`   Overall lines: ${this.report.overall.lines.toFixed(1)}%`);

    const critical = this.report.services.filter((s) => s.status === 'critical').length;
    const warning = this.report.services.filter((s) => s.status === 'warning').length;
    const good = this.report.services.filter((s) => s.status === 'good').length;

    console.log(`\n   Status:`);
    console.log(`   ✅ Good: ${good}`);
    console.log(`   ⚠️  Warning: ${warning}`);
    console.log(`   🚨 Critical: ${critical}`);

    if (this.report.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      this.report.recommendations.forEach((r) => console.log(`   ${r}`));
    }
  }
}

// Run analysis
const analyzer = new CoverageAnalyzer();
analyzer.analyze().catch((error) => {
  console.error('❌ Coverage analysis failed:', error);
  process.exit(1);
});
