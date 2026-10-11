module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!uuid)',
  ],
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  // Regression ratchet: coverage must not drop below today's level. Raise
  // these toward 70/70/70/70 as tests are added (pipes/decorators currently
  // have none).
  coverageThreshold: {
    global: {
      statements: 35,
      branches: 35,
      functions: 40,
      lines: 43,
    },
  },
};
