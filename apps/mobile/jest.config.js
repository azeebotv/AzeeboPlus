const { sharedModuleNameMapper } = require('../../jest.shared.config.js');

module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts', 'tsx'],
  testRegex: '.*\\.(spec|test)\\.tsx?$',
  moduleNameMapper: {
    // @azeebo/react-data is consumed as TS source (see tsconfig paths); jest
    // needs the same mapping to resolve its modules when tests import it.
    '^@azeebo/react-data$': '<rootDir>/../../packages/react-data/src/index.ts',
    '^@azeebo/react-data/(.*)$': '<rootDir>/../../packages/react-data/src/$1',
    ...sharedModuleNameMapper,
  },
  transform: {
    '^.+\\.(t|j)sx?$': ['ts-jest', { tsconfig: { jsx: 'react-jsx' } }],
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
  passWithNoTests: true,
  roots: ['<rootDir>/src', '<rootDir>/app'],
  testPathIgnorePatterns: ['/node_modules/', '/e2e/'],
};
