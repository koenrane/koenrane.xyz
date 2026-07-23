import pluginJs from "@eslint/js"
import perfectionist from "eslint-plugin-perfectionist"
import pluginReact from "eslint-plugin-react"
import globals from "globals"
import tseslint from "typescript-eslint"

export default [
  {
    plugins: {
      perfectionist,
    },
    rules: {
      "perfectionist/sort-imports": [
        "error",
        {
          type: "natural",
          order: "asc",
        },
      ],
    },
  },

  { files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"] },

  {
    ignores: [
      "content/",
      "htmlcov/",
      "public/",
      "backstop/",
      "**/*!*",
      "quartz/.quartz-cache/",
      "node_modules/",
      "**/*.min.js",
      "**/*.min.ts",
      "quartz/i18n/",
    ],
  },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  // Preact uses the automatic JSX runtime (jsxImportSource: "preact"), so React
  // does not need to be in scope. Disables react-in-jsx-scope / jsx-uses-react.
  pluginReact.configs.flat["jsx-runtime"],

  {
    settings: {
      react: {
        version: "detect",
      },
    },
    // Preact uses lowercase DOM attribute names (spellcheck, crossorigin) and
    // custom attributes (spa-preserve); React's no-unknown-property rule flags
    // these as errors, so it does not apply to this Preact codebase.
    rules: {
      "react/no-unknown-property": "off",
    },
  },
]
