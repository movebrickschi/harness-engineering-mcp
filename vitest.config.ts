import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["test/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/core/**/*.ts", "src/mcp/tools/init.ts", "src/mcp/tools/check.ts"],
      exclude: ["src/types/**"],
      thresholds: {
        statements: 70,
        lines: 70,
        functions: 70,
        branches: 50,
      },
    },
  },
});
