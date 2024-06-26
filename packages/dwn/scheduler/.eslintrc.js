module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint/eslint-plugin", "unused-imports"],
  extends: ["plugin:@typescript-eslint/recommended", "airbnb-base", "prettier"],
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: [".eslintrc.js", "packages/@extrimian/**"],
  rules: {
    // Import - Export rules
    "unused-imports/no-unused-imports": "error",
    "unused-imports/no-unused-vars": [
      "warn",
      {
        vars: "all",
        varsIgnorePattern: "^_",
        args: "after-used",
        argsIgnorePattern: "^_",
      },
    ],
    "import/prefer-default-export": "off",
    "import/extensions": "off",
    "import/no-unresolved": "off",
    // Typescript rules
    "@typescript-eslint/interface-name-prefix": "off",
    "@typescript-eslint/explicit-function-return-type": "error",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/type-annotation-spacing": [
      "error",
      { before: true, after: true },
    ],
    "@typescript-eslint/no-shadow": "error",
    // Spacing rules
    "arrow-spacing": ["error", { before: true, after: true }],
    "comma-spacing": ["error", { before: false, after: true }],
    "keyword-spacing": ["error", { before: true, after: true }],
    "array-bracket-spacing": ["error", "always"],
    "block-spacing": ["error", "always"],
    "space-in-parens": ["error", "always"],
    "object-curly-spacing": ["error", "always"],
    "key-spacing": "error",
    "no-mixed-spaces-and-tabs": "error",
    "lines-between-class-members": "off",
    // Misc rules
    indent: ["error", 2],
    quotes: ["error", "single", { allowTemplateLiterals: true }],
    semi: "error",
    "no-shadow": "off",
    "quote-props": ["error", "as-needed"],
    "no-empty-function": ["error", { allow: ["constructors"] }],
    "no-use-before-define": "off",
    "no-unused-vars": "error",
    "prefer-const": "warn",
    "no-console": "warn",
    "class-methods-use-this": "off",
    "no-useless-constructor": "off",
  },
};
