import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'
import globals from 'globals'

export default tseslint.config(
  { ignores: ['dist/', 'dev-dist/', 'node_modules/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: { parser: tseslint.parser },
      // no-undef stays active in .vue files (unlike .ts, where
      // typescript-eslint turns it off), so browser globals are needed.
      globals: { ...globals.browser },
    },
  },
  {
    // src/domain/ is pure TypeScript: no framework imports allowed.
    files: ['src/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: ['vue', 'vuetify', 'pinia'],
          patterns: ['vue/*', 'vuetify/*', 'pinia/*'],
        },
      ],
    },
  },
  prettier,
)
