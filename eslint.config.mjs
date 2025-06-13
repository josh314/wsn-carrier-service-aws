// eslint.config.mjs  — Flat-config style for ESLint ≥ 9
import globals  from "globals";
import js        from "@eslint/js";
import tseslint  from "typescript-eslint";

/* ---------- shared snippets ------------------------------------------------ */

const jsFiles = ["**/*.{js,mjs,cjs}"];
const tsFilesInfra = ["*.ts", "lib/*.ts" ];
const tsFilesLambda = [ "src/**/*.ts" ];
const tsFiles = [...tsFilesInfra, ...tsFilesLambda];

const noUnused = [
  "warn",
  {
    varsIgnorePattern  : "^_",   // allow const _foo = …
    argsIgnorePattern  : "^_",   // allow function ( _evt )
    caughtErrors       : "none",
  },
];

/* ---------- config --------------------------------------------------------- */

/** @type {import("eslint").Linter.FlatConfig[]} */
export default [
  /* ignore stuff we never lint --------------------------------------------- */
  {
    ignores: ["node_modules/**", "dist/**", "cdk.out/**"],
  },

  /*  JS files --------------------------------------------------------------- */
  {
    files: jsFiles,
    ...js.configs.recommended,         // core JS rules
    languageOptions: {
      ...js.configs.recommended.languageOptions,
      globals: globals.node,           // Node-built-ins in JS too
    },
    rules: {
      indent: ["warn", 2, { SwitchCase: 1 }],
      "no-unused-vars": noUnused,
      semi: ["warn", "always"],
    },
  },

  // TS - parser + TS-specific rules
  // NOte we need to use different `tsconfig.json` files for infra and lambda code

  {
    files: tsFilesInfra,
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: ["./tsconfig.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      globals: globals.node,
    },
  },

  {
    files: tsFilesLambda,
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: ["./src/tsconfig.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      globals: globals.node,
    },
  },

  /* --------- TS recommended presets ------------------------------------

     `tseslint.configs.recommendedTypeChecked` returns an array of config objects with no `files` matcher.
     We need to scope these objects to only tsFiles
  */
  ...tseslint.configs.recommendedTypeChecked.map((cfg) => ({
    ...cfg,
    files: tsFiles,
  })),

  // TS - custom rule overrides (step 3)
  {
    files: tsFiles,
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": noUnused,
      "@typescript-eslint/no-explicit-any": "off",
      indent: "off",
      semi: ["warn", "always"],
    },
  },

  /*  project-wide tweaks (optional) ---------------------------------------- */
  // put anything here that *really* must apply to every file, after presets
];
