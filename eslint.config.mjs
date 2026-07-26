import js from "@eslint/js"
import globals from "globals"

export default [
  { ignores: ["dist/**", "node_modules/**", "*.config.*"] },
  {
    files: ["js/**/*.js"],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "module",
      globals: {
        ...globals.browser,
        tmi: "readonly",
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      "no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    files: ["js/event-handlers.js"],
    languageOptions: {
      globals: {
        module: "readonly",
      },
    },
  },
]
