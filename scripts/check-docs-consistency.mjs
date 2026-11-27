#!/usr/bin/env node
/**
 * Automated documentation consistency checker.
 *
 * Verifies that all implemented microservices, frontend applications, and shared
 * packages in the codebase are documented in ARCHITECTURE.md, README.md,
 * CLAUDE.md, and docs/SERVICES.md.
 *
 * Run: `node scripts/check-docs-consistency.mjs`
 */

import { readdirSync, statSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const errors = [];

// 1. Gather all services in services/*/*
const servicesDir = path.join(root, 'services');
const serviceGroups = readdirSync(servicesDir).filter(f =>
  statSync(path.join(servicesDir, f)).isDirectory()
);

const implementedServices = [];
for (const group of serviceGroups) {
  const groupPath = path.join(servicesDir, group);
  const svcs = readdirSync(groupPath).filter(f =>
    statSync(path.join(groupPath, f)).isDirectory() &&
    existsSync(path.join(groupPath, f, 'package.json'))
  );
  for (const s of svcs) {
    implementedServices.push({ group, name: s });
  }
}

// 2. Gather all apps in apps/*
const appsDir = path.join(root, 'apps');
const implementedApps = readdirSync(appsDir).filter(f =>
  statSync(path.join(appsDir, f)).isDirectory() &&
  existsSync(path.join(appsDir, f, 'package.json'))
);

// 3. Gather all packages in packages/*
const packagesDir = path.join(root, 'packages');
const implementedPackages = readdirSync(packagesDir).filter(f =>
  statSync(path.join(packagesDir, f)).isDirectory() &&
  !f.startsWith('.')
);

// Read documentation files
const archContent = readFileSync(path.join(root, 'ARCHITECTURE.md'), 'utf-8');
const readmeContent = readFileSync(path.join(root, 'README.md'), 'utf-8');
const claudeContent = readFileSync(path.join(root, 'CLAUDE.md'), 'utf-8');
const servicesDocContent = readFileSync(path.join(root, 'docs/SERVICES.md'), 'utf-8');

console.log(`Auditing documentation consistency:`);
console.log(`- Services found: ${implementedServices.length}`);
console.log(`- Apps found: ${implementedApps.length}`);
console.log(`- Packages found: ${implementedPackages.length}\n`);

// Check service documentation
for (const svc of implementedServices) {
  if (!servicesDocContent.includes(svc.name)) {
    errors.push(`docs/SERVICES.md is missing service: ${svc.name}`);
  }
  if (!readmeContent.includes(svc.name)) {
    errors.push(`README.md is missing service: ${svc.name}`);
  }
  if (!claudeContent.includes(svc.name)) {
    errors.push(`CLAUDE.md is missing service: ${svc.name}`);
  }
  if (!archContent.includes(svc.name)) {
    errors.push(`ARCHITECTURE.md is missing service: ${svc.name}`);
  }
}

// Check app documentation
for (const app of implementedApps) {
  if (!readmeContent.includes(`apps/${app}`) && !readmeContent.includes(`| ${app} |`)) {
    errors.push(`README.md is missing app: ${app}`);
  }
  if (!claudeContent.includes(`apps/${app}`) && !claudeContent.includes(`${app}/`)) {
    errors.push(`CLAUDE.md is missing app: ${app}`);
  }
  if (!archContent.includes(app)) {
    errors.push(`ARCHITECTURE.md is missing app: ${app}`);
  }
}

// Check package documentation
for (const pkg of implementedPackages) {
  if (!readmeContent.includes(pkg)) {
    errors.push(`README.md is missing shared package: ${pkg}`);
  }
  if (!archContent.includes(pkg)) {
    errors.push(`ARCHITECTURE.md is missing shared package: ${pkg}`);
  }
}

if (errors.length > 0) {
  console.error(`❌ Documentation consistency check failed (${errors.length} errors):`);
  for (const e of errors) {
    console.error(`  - ${e}`);
  }
  process.exit(1);
}

console.log(`✅ Documentation is fully consistent with codebase reality!`);
console.log(`   All ${implementedServices.length} services, ${implementedApps.length} apps, and ${implementedPackages.length} packages are documented.`);
