const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  ...expoConfig,
  {
    ignores: ['dist/**', 'web-build/**'],
    rules: {
      // Expo screens intentionally reset local controller snapshots when a runtime/session changes.
      'react-hooks/set-state-in-effect': 'off',
      // Time is sampled inside user actions and lazy state initializers, never as rendered output.
      'react-hooks/purity': 'off',
    },
  },
]);
