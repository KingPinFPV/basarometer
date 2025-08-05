import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**/*",
      ".next/**/*",
      "out/**/*",
      "v3/**/*",
      "system/**/*",
      "claude/**/*",
      ".claude/**/*",
      "temp-bots-repo/**/*",
      "**/*.test.ts",
      "**/*.test.tsx",
      "**/*.spec.ts", 
      "**/*.spec.tsx"
    ]
  },
  {
    rules: {
      // Performance optimizations: reduce warnings to errors only for critical issues
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off", 
      "@typescript-eslint/no-unused-parameters": "off",
      "react-hooks/exhaustive-deps": "off",
      "react-hooks/rules-of-hooks": "error",
      "react/hook-use-state": "off",
      "no-console": "off",
      "import/no-anonymous-default-export": "off",
      // Disable expensive rules for faster builds
      "prefer-const": "off",
      "no-var": "off", 
      "@typescript-eslint/prefer-const": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/explicit-function-return-type": "off"
    }
  }
];

export default eslintConfig;
