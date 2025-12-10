import tsParser from '@typescript-eslint/parser'

// Minimal ESLint flat config for this repository audit.
// We avoid extending the Sanity studio config here to prevent requiring
// additional ESLint plugins in this environment. This config focuses on
// recognizing environment globals and ignoring build artifacts.

export default [
  {
    ignores: [
      'server/dist/**',
      '**/dist/**',
      'node_modules/**',
      'apps/admin/public/**',
      'coverage/**',
    ],
  },
  {
    files: ['apps/admin/src/**'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module',
        ecmaFeatures: {jsx: true},
        project: ['./tsconfig.eslint.admin.json'],
        tsconfigRootDir: process.cwd(),
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        fetch: 'readonly',
        FormData: 'readonly',
        FileReader: 'readonly',
        Blob: 'readonly',
        console: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
      // Disable rules that require additional plugins not installed in this environment
      'react-hooks/exhaustive-deps': 'off',
    },
  },
  {
    files: ['server/src/**/*.{ts,tsx}', 'core-api/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module',
        project: ['./tsconfig.eslint.server.json'],
        tsconfigRootDir: process.cwd(),
      },
      globals: {
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        console: 'readonly',
      },
    },
    rules: {},
  },
  {
    files: ['server/**/*.{js,cjs,mjs}'],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module',
      },
      globals: {
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        console: 'readonly',
      },
    },
    rules: {},
  },
]
