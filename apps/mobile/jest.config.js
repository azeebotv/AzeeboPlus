const { sharedModuleNameMapper } = require('../../jest.shared.config.js');

module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts', 'tsx'],
  globals: { __DEV__: false },
  testRegex: '.*\\.(spec|test)\\.tsx?$',
  moduleNameMapper: {
    '^expo-secure-store$': '<rootDir>/__mocks__/expo-secure-store.js',
    '^@react-native-async-storage/async-storage$': '<rootDir>/__mocks__/async-storage.js',
    '^react-native$': '<rootDir>/__mocks__/react-native.js',
    '^expo-constants$': '<rootDir>/__mocks__/expo-constants.js',
    // @azeebo/react-data is consumed as TS source (see tsconfig paths); jest
    // needs the same mapping to resolve its modules when tests import it.
    '^@azeebo/react-data$': '<rootDir>/../../packages/react-data/src/index.ts',
    '^@azeebo/react-data/(.*)$': '<rootDir>/../../packages/react-data/src/$1',
    ...sharedModuleNameMapper,
  },
  transform: {
    '^.+\\.(t|j)sx?$': ['ts-jest', { tsconfig: { jsx: 'react-jsx' }, isolatedModules: true }],
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
  passWithNoTests: true,
  roots: ['<rootDir>/src', '<rootDir>/app', '<rootDir>/__tests__'],
  testPathIgnorePatterns: ['/node_modules/', '/e2e/'],
};
