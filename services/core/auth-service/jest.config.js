module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', { diagnostics: false }],
  },
  transformIgnorePatterns: [
    // pnpm layout is node_modules/.pnpm/<pkg>@<ver>/node_modules/<pkg>/..., so a
    // bare lookahead after the first node_modules/ never sees the package name.
    // Match the whitelisted package name anywhere in the remainder of the path.
    'node_modules/(?!.*(?:uuid|zod|sanitize-html|htmlparser2|domhandler|domutils|dom-serializer|entities|domelementtype|css-select|boolbase|css-what|nth-check))',
  ],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@azeebo/(.*)$': '<rootDir>/../../../../packages/$1/src',
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
