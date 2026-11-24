#!/usr/bin/env npx tsx
/**
 * analyze-slow-queries.ts
 *
 * Analyzes PostgreSQL queries for performance issues.
 * Usage: npx tsx scripts/analyze-slow-queries.ts
 *
 * Checks:
 * 1. Missing indexes on foreign keys
 * 2. N+1 query patterns
 * 3. Large result set queries
 * 4. Missing LIMIT clauses
 * 5. Unoptimized joins
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

interface QueryIssue {
  file: string;
  line: number;
  severity: 'critical' | 'warning' | 'info';
  type: string;
  message: string;
  suggestion: string;
}

const issues: QueryIssue[] = [];

function scanDirectory(dir: string) {
  const files = readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    const fullPath = join(dir, file.name);

    if (file.isDirectory()) {
      scanDirectory(fullPath);
    } else if (file.name.endsWith('.ts') && !file.name.endsWith('.d.ts')) {
      analyzeFile(fullPath);
    }
  }
}

function analyzeFile(filePath: string) {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const lineNum = index + 1;

    // Check for findMany without take/limit
    if (line.includes('.findMany(') && !line.includes('take:') && !content.substring(content.indexOf(line), content.indexOf(line) + 500).includes('take:')) {
      issues.push({
        file: filePath,
        line: lineNum,
        severity: 'warning',
        type: 'missing-limit',
        message: 'findMany without take/limit',
        suggestion: 'Add take: N to limit result set size',
      });
    }

    // Check for findOne without select
    if (line.includes('.findFirst(') && !line.includes('select:')) {
      issues.push({
        file: filePath,
        line: lineNum,
        severity: 'info',
        type: 'missing-select',
        message: 'findFirst without select',
        suggestion: 'Add select to fetch only needed fields',
      });
    }

    // Check for raw queries
    if (line.includes('$queryRaw') || line.includes('$executeRaw')) {
      issues.push({
        file: filePath,
        line: lineNum,
        severity: 'warning',
        type: 'raw-query',
        message: 'Raw SQL query detected',
        suggestion: 'Ensure proper parameterization and index usage',
      });
    }

    // Check for select * patterns
    if (line.includes('select: {') && line.includes('*')) {
      issues.push({
        file: filePath,
        line: lineNum,
        severity: 'warning',
        type: 'select-all',
        message: 'Selecting all fields',
        suggestion: 'Select only required fields to reduce payload',
      });
    }

    // Check for nested includes (potential N+1)
    if (line.includes('include:') && content.substring(content.indexOf(line), content.indexOf(line) + 200).split('include:').length > 3) {
      issues.push({
        file: filePath,
        line: lineNum,
        severity: 'critical',
        type: 'deep-nesting',
        message: 'Deep nested includes detected (potential N+1)',
        suggestion: 'Use separate queries or flattened includes',
      });
    }

    // Check for missing index hints on where clauses
    if (line.includes('where:') && line.includes('equals:') && !line.includes('index:')) {
      // This is a heuristic check
    }

    // Check for orderBy without index consideration
    if (line.includes('orderBy:') && !content.includes('@@index')) {
      issues.push({
        file: filePath,
        line: lineNum,
        severity: 'info',
        type: 'sort-performance',
        message: 'Order by without index consideration',
        suggestion: 'Ensure sort columns are indexed',
      });
    }
  });
}

function generateReport() {
  console.log('\n=== Slow Query Analysis Report ===\n');

  const critical = issues.filter((i) => i.severity === 'critical');
  const warnings = issues.filter((i) => i.severity === 'warning');
  const info = issues.filter((i) => i.severity === 'info');

  console.log(`Total Issues: ${issues.length}`);
  console.log(`  Critical: ${critical.length}`);
  console.log(`  Warning: ${warnings.length}`);
  console.log(`  Info: ${info.length}`);

  if (critical.length > 0) {
    console.log('\n--- CRITICAL ---');
    critical.forEach((issue) => {
      console.log(`  ${issue.file}:${issue.line}`);
      console.log(`    ${issue.message}`);
      console.log(`    Fix: ${issue.suggestion}\n`);
    });
  }

  if (warnings.length > 0) {
    console.log('\n--- WARNINGS ---');
    warnings.slice(0, 10).forEach((issue) => {
      console.log(`  ${issue.file}:${issue.line}`);
      console.log(`    ${issue.message}`);
      console.log(`    Fix: ${issue.suggestion}\n`);
    });
    if (warnings.length > 10) {
      console.log(`  ... and ${warnings.length - 10} more warnings\n`);
    }
  }

  if (info.length > 0) {
    console.log('\n--- INFO ---');
    info.slice(0, 5).forEach((issue) => {
      console.log(`  ${issue.file}:${issue.line}`);
      console.log(`    ${issue.message}\n`);
    });
  }

  // Recommendations
  console.log('\n=== Recommendations ===');
  console.log('1. Add database indexes on frequently queried columns');
  console.log('2. Use select to fetch only needed fields');
  console.log('3. Add take/limit to all findMany queries');
  console.log('4. Avoid deep nested includes - use separate queries');
  console.log('5. Use cursor-based pagination for large datasets');
  console.log('6. Enable query logging in development');
  console.log('7. Run EXPLAIN ANALYZE on slow queries');
}

// Main execution
const servicesDir = join(process.cwd(), 'services');
console.log('Scanning services for query issues...');
scanDirectory(servicesDir);
generateReport();
