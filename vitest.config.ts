import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["test/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.ts"],
      exclude: ["src/types/**", "src/index.ts"],
      thresholds: {
        statements: 80,
        lines: 80,
        functions: 88,
        branches: 72,
      },
    },
  },
});
