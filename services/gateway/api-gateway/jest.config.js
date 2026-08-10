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
    // zod v4's exports map doesn't expose ./v4/classic/external.cjs, which
    // jest-resolve 29 enforces even for its own internal require (Node's CJS
    // require ignores exports, so production is unaffected). Bypass it by
    // mapping the internal path to the physical file in the pnpm store.
    '^.*v4/classic/external\.cjs$':
      '<rootDir>/../../../../node_modules/.pnpm/zod@4.4.3/node_modules/zod/v4/classic/external.cjs',
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
