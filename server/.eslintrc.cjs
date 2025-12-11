module.exports = {
  env: {
    node: true,
    es2021: true,
  },
  globals: {
    process: "readonly",
    Buffer: "readonly",
  },
  rules: {
    "@typescript-eslint/no-var-requires": "off",
  },
};
