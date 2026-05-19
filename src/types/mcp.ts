/**
 * MCP server runtime types. Wraps the official SDK types to a minimal surface
 * our tools and resource handlers can rely on without importing SDK internals.
 */

import type { CheckStatus } from "./harness.js";

export interface ToolCallContext {
  toolName: string;
  cwd: string;
  startedAt: number;
}

export interface ResourceUriPattern {
  pattern: string;
  description: string;
}

export interface ToolDefinition<TInput, TOutput> {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (input: TInput, ctx: ToolCallContext) => Promise<TOutput>;
}

export interface ToolResult {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
}

export interface ResourceListItem {
  uri: string;
  name: string;
  mimeType?: string;
  description?: string;
}

export interface ResourceContent {
  uri: string;
  mimeType: string;
  text: string;
}

export interface RuntimeStats {
  startedAt: number;
  toolCalls: number;
  resourceReads: number;
  lastError: string | null;
  status: CheckStatus | "RUNNING";
}
