import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  {
    rules: {
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-empty': 'warn',
      'no-empty-pattern': 'warn',
      'vue/multi-word-component-names': 'off',
      'vue/no-multiple-template-root': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', destructuredArrayIgnorePattern: '^_' }],
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-invalid-void-type': 'warn',
      '@typescript-eslint/no-unsafe-function-type': 'warn',
      'import/first': 'warn',
      'import/no-duplicates': 'warn',
    },
  },
  {
    ignores: [
      'coverage/**',
      '.nuxt/**',
      '.output/**',
      'node_modules/**',
    ],
  },
)
