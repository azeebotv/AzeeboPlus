/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.e2e\\.spec\\.ts$',
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.ts', '!**/*.spec.ts', '!**/*.e2e.spec.ts'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  // E2E tests need more time for database operations
  testTimeout: 120000,
  // Only run E2E test files
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};
