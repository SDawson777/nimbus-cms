module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  globals: {
    window: 'readonly',
    document: 'readonly',
    fetch: 'readonly',
    FormData: 'readonly',
    FileReader: 'readonly',
    Blob: 'readonly',
  },
  rules: {
    'no-console': 'off',
  },
}
