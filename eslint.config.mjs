import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default [
  { ignores: ['dist/**', '**/dist/**', 'node_modules/**', 'coverage/**', '*.config.*', '*.d.ts'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      'no-console': 'warn',
    },
  },
  {
    files: ['**/*.{cjs,mjs,js}', '!dist/**', '!**/dist/**', '**/*.config.*'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
];
