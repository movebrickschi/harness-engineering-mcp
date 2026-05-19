import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["src/index.ts"],
    format: ["esm"],
    dts: true,
    clean: true,
    sourcemap: true,
    target: "node20",
    outDir: "dist",
  },
  {
    entry: { cli: "src/cli/index.ts" },
    format: ["esm"],
    clean: false,
    sourcemap: true,
    target: "node20",
    outDir: "dist",
    banner: { js: "#!/usr/bin/env node" },
  },
  {
    entry: { "mcp-server": "src/mcp/server.ts" },
    format: ["esm"],
    clean: false,
    sourcemap: true,
    target: "node20",
    outDir: "dist",
    banner: { js: "#!/usr/bin/env node" },
  },
]);
