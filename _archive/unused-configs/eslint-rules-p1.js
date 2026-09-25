/**
 * P1 ESLint Rules Configuration
 * C-005, C-006, C-007: Code quality rules
 */

module.exports = {
  rules: {
    // C-006: Unused import detection
    '@typescript-eslint/no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      caughtErrorsIgnorePattern: '^_',
    }],
    
    // C-007: Code complexity limits
    'max-lines-per-function': ['warn', { max: 100 }],
    'max-lines-per-class': ['warn', { max: 300 }],
    'max-depth': ['warn', 4],
    'max-nested-callbacks': ['warn', 3],
    'max-params': ['warn', 5],
    
    // C-008: Naming conventions
    '@typescript-eslint/naming-convention': [
      'warn',
      { selector: 'variable', format: ['camelCase', 'PascalCase', 'UPPER_CASE'] },
      { selector: 'function', format: ['camelCase', 'PascalCase'] },
      { selector: 'class', format: ['PascalCase'] },
      { selector: 'interface', format: ['PascalCase'] },
      { selector: 'typeAlias', format: ['PascalCase'] },
      { selector: 'enum', format: ['PascalCase'] },
      { selector: 'enumMember', format: ['UPPER_CASE'] },
    ],
  },
};
