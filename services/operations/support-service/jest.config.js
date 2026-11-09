const { sharedModuleNameMapper } = require('../../../jest.shared.config.js');

module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts', 'cjs'],
  rootDir: 'src',
  testRegex: '.*\.spec\.ts$',
  transform: {
    '^.+\.(t|j)s$': 'ts-jest',
  },
  transformIgnorePatterns: ['node_modules/(?!uuid|date-fns)'],
  moduleNameMapper: {
    // Subpath exports must be mapped explicitly — the generic rule below
    // would turn '@azeebo/security/log-redaction' into a bogus src path.
    '^@azeebo/security/log-redaction$':
      '<rootDir>/../../../../packages/security/src/log-redaction/index.ts',
    '^@azeebo/security$': '<rootDir>/../../../../packages/security/src',
    ...sharedModuleNameMapper,
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!main.ts',
    '!**/*.module.ts',
    '!**/*.dto.ts',
    '!**/*.entity.ts',
    '!**/*.interface.ts',
    '!**/index.ts',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
