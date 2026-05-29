import { defineConfig } from "tsup";

const BUNDLED_DEPS = [
  "@modelcontextprotocol/sdk",
  "commander",
  "handlebars",
  "picocolors",
  "prompts",
];

// 被打进 ESM 产物的 CJS 依赖（如 commander）在运行时会 require() Node 内置模块；
// esbuild 默认的 __require shim 对此抛 "Dynamic require of \"events\" is not supported"，
// 导致 dist/cli.js 一启动就崩。注入 createRequire 让 ESM 产物拥有真正可用的 require。
const ESM_REQUIRE_SHIM = `import { createRequire as __harnessCreateRequire } from "node:module";
const require = __harnessCreateRequire(import.meta.url);`;
const SHEBANG = "#!/usr/bin/env node";

export default defineConfig([
  {
    entry: ["src/index.ts"],
    format: ["esm"],
    dts: true,
    clean: true,
    sourcemap: true,
    target: "node20",
    outDir: "dist",
    banner: { js: ESM_REQUIRE_SHIM },
    noExternal: BUNDLED_DEPS,
  },
  {
    entry: { cli: "src/cli/index.ts" },
    format: ["esm"],
    clean: false,
    sourcemap: true,
    target: "node20",
    outDir: "dist",
    banner: { js: `${SHEBANG}\n${ESM_REQUIRE_SHIM}` },
    noExternal: BUNDLED_DEPS,
  },
  {
    entry: { "mcp-server": "src/mcp/server.ts" },
    format: ["esm"],
    clean: false,
    sourcemap: true,
    target: "node20",
    outDir: "dist",
    banner: { js: `${SHEBANG}\n${ESM_REQUIRE_SHIM}` },
    noExternal: BUNDLED_DEPS,
  },
]);
