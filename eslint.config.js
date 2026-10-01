import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';

export default [
  { ignores: ['dist/', 'test-results/', 'playwright-report/'] },
  js.configs.recommended,
  ...svelte.configs.recommended,
  { languageOptions: { globals: globals.browser } },
  // Tests run in Node but also pass callbacks into the browser page.
  { files: ['*.config.js', 'tests/**'], languageOptions: { globals: globals.node } },
];
