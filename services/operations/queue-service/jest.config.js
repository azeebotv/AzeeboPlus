module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts', 'cjs'],
  rootDir: 'src',
  testRegex: '.*\.spec\.ts$',
  transform: {
    '^.+\.(t|j)s$': 'ts-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!uuid|date-fns)',
  ],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@azeebo/shared-services$': '<rootDir>/../../../../packages/shared-services/src',
    '^@azeebo/shared-services/(.*)$': '<rootDir>/../../../../packages/shared-services/src/$1',
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
