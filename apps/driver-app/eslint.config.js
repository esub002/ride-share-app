// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = {
  extends: [
    'expo',
    'universe/native',
    'universe/shared/typescript-analysis',
  ],
  overrides: [
    {
      files: ['*.ts', '*.tsx', '*.d.ts'],
      parserOptions: {
        project: './tsconfig.json',
      },
    },
  ],
  rules: {
    'prettier/prettier': 'off',
    '@typescript-eslint/no-unused-vars': 'warn',
    'no-console': 'off',
  },
  ignorePatterns: ['node_modules/', '.expo/', 'dist/'],
};
