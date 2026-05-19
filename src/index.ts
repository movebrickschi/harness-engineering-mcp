/**
 * Public entry point for programmatic embedding.
 * Most consumers should NOT import this — they should run the binaries
 * `harness` (CLI) or `harness-mcp` (MCP server) directly.
 */

export * from "./types/harness.js";
export * from "./types/mcp.js";
export { createMcpServer } from "./mcp/server.js";
export { runCli } from "./cli/index.js";
export { assetsRoot, readAsset, listAssetSkills } from "./core/assets.js";
export { scanProject } from "./core/scanner/index.js";
export { routeTask } from "./core/router/index.js";
export { runChecks } from "./core/checker/runner.js";
export { loadHarnessConfig } from "./core/config/loader.js";
