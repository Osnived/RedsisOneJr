import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'coverage/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // AGENTS.md: nunca utilizar any.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      // Las llamadas HTTP viven en los servicios, nunca en componentes.
      'no-restricted-globals': [
        'error',
        { name: 'fetch', message: 'Usa apiClient en lugar de fetch directamente.' },
      ],
    },
  },
  {
    // El cliente HTTP es el único autorizado a usar fetch.
    files: ['src/lib/api-client.ts'],
    rules: { 'no-restricted-globals': 'off' },
  },
  {
    // TanStack Router exige exportar la ruta junto a su componente: es el
    // patrón previsto por la librería, no un descuido.
    files: ['src/routes/**/*.tsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
);
