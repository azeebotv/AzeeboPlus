module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  transformIgnorePatterns: ['<rootDir>/../dist'],
  collectCoverageFrom: ['**/*.(t|j)s', '!prisma/client/**'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  // Regression ratchet: coverage must not drop below today's level. Raise
  // these toward 70/70/70/70 as tests are added to the weaker modules.
  coverageThreshold: {
    global: {
      statements: 45,
      branches: 36,
      functions: 40,
      lines: 46,
    },
  },
};
