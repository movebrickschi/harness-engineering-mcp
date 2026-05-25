import { defineConfig } from "tsup";

const BUNDLED_DEPS = [
  "@modelcontextprotocol/sdk",
  "commander",
  "handlebars",
  "picocolors",
  "prompts",
];

export default defineConfig([
  {
    entry: ["src/index.ts"],
    format: ["esm"],
    dts: true,
    clean: true,
    sourcemap: true,
    target: "node20",
    outDir: "dist",
    noExternal: BUNDLED_DEPS,
  },
  {
    entry: { cli: "src/cli/index.ts" },
    format: ["esm"],
    clean: false,
    sourcemap: true,
    target: "node20",
    outDir: "dist",
    banner: { js: "#!/usr/bin/env node" },
    noExternal: BUNDLED_DEPS,
  },
  {
    entry: { "mcp-server": "src/mcp/server.ts" },
    format: ["esm"],
    clean: false,
    sourcemap: true,
    target: "node20",
    outDir: "dist",
    banner: { js: "#!/usr/bin/env node" },
    noExternal: BUNDLED_DEPS,
  },
]);
