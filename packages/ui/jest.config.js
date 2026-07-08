module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts', 'tsx'],
  testRegex: '.*\\.spec\\.tsx?$',
  transform: {
    '^.+\\.(t|j)sx?$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.stories.*',
    '!src/**/*.d.ts',
  ],
  coverageDirectory: './coverage',
  testEnvironment: 'jsdom',
  passWithNoTests: true,
  roots: ['<rootDir>/src'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@testing-library/react-native)/)',
  ],
  moduleNameMapper: {
    '^react-native$': '<rootDir>/__mocks__/react-native.js',
    '^@azeebo/design-tokens$': '<rootDir>/../design-tokens/src/index.ts',
  },
};
