const { sharedModuleNameMapper } = require('../../jest.shared.config.js');

/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: 'src',
  testMatch: ['**/*.spec.ts', '**/*.pact.spec.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleNameMapper: {
    // Service sources (e.g. creator-service's wallet-payloads.ts) use
    // NodeNext-style './x.js' relative imports; map them to the real .ts
    // files so ts-jest can compile them.
    ...sharedModuleNameMapper,
  },
  collectCoverageFrom: ['**/*.ts', '!**/*.spec.ts', '!**/*.pact.spec.ts', '!**/index.ts'],
  coverageDirectory: '../coverage',
  verbose: true,
};
