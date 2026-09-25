#!/usr/bin/env tsx
/**
 * Script to automatically add @Inject() decorators to all constructor parameters
 * in @Injectable() classes across all services.
 *
 * Root cause: tsx (esbuild) does not emit emitDecoratorMetadata, which NestJS
 * needs to resolve constructor parameter types. Adding explicit @Inject() decorators
 * tells NestJS exactly what to inject, bypassing the need for metadata.
 */

import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';

const SERVICES_DIR = path.join(process.cwd(), 'services');

// Types that DON'T need @Inject() - they're primitives or not DI tokens
const SKIP_TYPES = new Set([
  'string', 'number', 'boolean', 'void', 'any', 'unknown', 'never',
  'Logger', 'ExecutionContext', 'Request', 'Response',
]);

// Decorator names that indicate a DI-instantiated class
const DI_DECORATORS = ['Injectable', 'Controller', 'Guard', 'Interceptor', 'Pipe'];

let totalFilesModified = 0;
let totalDecoratorsAdded = 0;

function walkDir(dir: string): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', 'dist', '.tmp'].includes(entry.name)) continue;
      files.push(...walkDir(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts') && !entry.name.endsWith('.spec.ts') && !entry.name.endsWith('.test.ts')) {
      files.push(fullPath);
    }
  }
  return files;
}

function processFile(filePath: string): boolean {
  const source = fs.readFileSync(filePath, 'utf8');
  // Quick check: must have a constructor AND one of the DI decorators
  if (!source.includes('constructor(')) return false;
  const hasDIDecorator = DI_DECORATORS.some(d => source.includes(`@${d}(`) || source.includes(`@${d}()`));
  if (!hasDIDecorator) return false;

  const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true);

  // Collect all insertions needed: array of { position, text }
  const insertions: { pos: number; text: string }[] = [];
  let needsInjectImport = false;

  ts.forEachChild(sourceFile, (node) => {
    if (!ts.isClassDeclaration(node) || !node.name) return;

    // Check if class has a DI decorator
    const classDecorators = ts.getDecorators(node);
    const hasDIClassDecorator = classDecorators?.some(d => {
      const text = d.getText(sourceFile).trim();
      return DI_DECORATORS.some(dec => text.includes(dec));
    });
    if (!hasDIClassDecorator) return;

      // Find constructor
      for (const member of node.members) {
        if (!ts.isConstructorDeclaration(member)) continue;
        if (member.parameters.length === 0) continue;

      // Process each parameter
      for (const param of member.parameters) {
        const paramType = param.type?.getText(sourceFile);
        if (!paramType || SKIP_TYPES.has(paramType)) continue;

        // Skip if already has any decorator
        const existingDecos = ts.getDecorators(param);
        if (existingDecos && existingDecos.length > 0) continue;

        // Find the position just before the parameter name (or before private/readonly)
        const paramStart = param.getStart(sourceFile);
        const injectText = `@Inject(${paramType}) `;

        insertions.push({ pos: paramStart, text: injectText });
        needsInjectImport = true;
      }
    }
  });

  if (insertions.length === 0) return false;

  // Apply insertions in reverse order to preserve positions
  let newSource = source;
  insertions.sort((a, b) => b.pos - a.pos); // reverse order
  for (const ins of insertions) {
    newSource = newSource.substring(0, ins.pos) + ins.text + newSource.substring(ins.pos);
  }

  // Add Inject import if needed
  if (needsInjectImport) {
    const hasInjectImport = /import\s*\{[^}]*\bInject\b[^}]*\}\s*from\s*['"]@nestjs\/common['"]/.test(newSource);

    if (!hasInjectImport) {
      // Add Inject to existing @nestjs/common import
      const commonImportRegex = /import\s*\{([^}]+)\}\s*from\s*['"]@nestjs\/common['"]/;
      const match = newSource.match(commonImportRegex);
      if (match) {
        const existingImports = match[1];
        if (!existingImports.includes('Inject')) {
          newSource = newSource.replace(commonImportRegex, `import { Inject,${existingImports} } from '@nestjs/common'`);
        }
      } else {
        // No @nestjs/common import found, add new line
        newSource = `import { Inject } from '@nestjs/common';\n${newSource}`;
      }
    }
  }

  fs.writeFileSync(filePath, newSource, 'utf8');
  totalFilesModified++;
  totalDecoratorsAdded += insertions.length;
  const relPath = path.relative(process.cwd(), filePath);
  console.log(`✓ ${relPath} (+${insertions.length} @Inject decorators)`);
  return true;
}

// Process all services
console.log('Scanning services for DI classes needing @Inject() (Injectable, Controller, Guard, Interceptor, Pipe)...\n');
const serviceFiles = walkDir(SERVICES_DIR);
for (const file of serviceFiles) {
  processFile(file);
}

// Also process apps/ (admin, creator are standalone dashboards with NestJS backends)
const APPS_DIR = path.join(process.cwd(), 'apps');
if (fs.existsSync(APPS_DIR)) {
  console.log('\nScanning apps for DI classes...\n');
  const appFiles = walkDir(APPS_DIR);
  for (const file of appFiles) {
    processFile(file);
  }
}

console.log(`\nDone! Modified ${totalFilesModified} files, added ${totalDecoratorsAdded} @Inject() decorators total.`);
