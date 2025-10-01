import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";


/** @type {import('eslint').Linter.Config[]} */
export default [
  {files: ["**/*.{js,mjs,cjs,ts,vue}"]},
  {languageOptions: { globals: globals.browser }},
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.vue"],
  },
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-function-type": "off",
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      'no-useless-escape': 'off'
    },
  },
];