const playwright = require('eslint-plugin-playwright');
const baseConfig = require('../../eslint.config.js');

module.exports = [
  playwright.configs['flat/recommended'],

  ...baseConfig,
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    // Override or add rules here
    rules: {
      'playwright/no-conditional-in-test': 'off',
    },
  },
];
