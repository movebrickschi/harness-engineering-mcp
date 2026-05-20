import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { registerInitTool } from "./tools/init.js";
import { registerCheckTool } from "./tools/check.js";
import { registerRouteTool } from "./tools/route.js";
import { registerLoadSkillTool } from "./tools/load-skill.js";
import { registerGateReviewTool } from "./tools/gate-review.js";
import { registerUpgradeTool } from "./tools/upgrade.js";
import { registerUninstallTool } from "./tools/uninstall.js";
import { registerSpecResources } from "./resources/spec.js";
import { registerSkillsResources } from "./resources/skills.js";
import { registerRulesResources } from "./resources/rules.js";
import { registerTemplatesResources } from "./resources/templates.js";
import type { ToolDefinition, ResourceListItem, ResourceContent } from "../types/mcp.js";

export interface ServerOptions {
  serverName?: string;
  serverVersion?: string;
}

type AnyToolDef = ToolDefinition<unknown, unknown>;

export function createMcpServer(options: ServerOptions = {}): Server {
  const server = new Server(
    {
      name: options.serverName ?? "harness-engineering-mcp",
      version: options.serverVersion ?? "0.2.0",
    },
    {
      capabilities: {
        tools: {},
        resources: {},
      },
    },
  );

  const tools: AnyToolDef[] = [
    registerInitTool() as AnyToolDef,
    registerCheckTool() as AnyToolDef,
    registerRouteTool() as AnyToolDef,
    registerLoadSkillTool() as AnyToolDef,
    registerGateReviewTool() as AnyToolDef,
    registerUpgradeTool() as AnyToolDef,
    registerUninstallTool() as AnyToolDef,
  ];

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: tools.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const tool = tools.find((t) => t.name === req.params.name);
    if (!tool) {
      return {
        content: [{ type: "text", text: `Unknown tool: ${req.params.name}` }],
        isError: true,
      };
    }
    try {
      const result = await tool.handler(req.params.arguments ?? {}, {
        toolName: tool.name,
        cwd: process.cwd(),
        startedAt: Date.now(),
      });
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text",
            text: `Tool ${tool.name} failed: ${err instanceof Error ? err.message : String(err)}`,
          },
        ],
        isError: true,
      };
    }
  });

  const resourceProviders = [
    registerSpecResources(),
    registerSkillsResources(),
    registerRulesResources(),
    registerTemplatesResources(),
  ];

  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    const items: ResourceListItem[] = [];
    for (const provider of resourceProviders) {
      items.push(...provider.list());
    }
    return { resources: items };
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (req) => {
    const uri = req.params.uri;
    for (const provider of resourceProviders) {
      if (provider.canRead(uri)) {
        const content: ResourceContent = await provider.read(uri);
        return {
          contents: [
            {
              uri: content.uri,
              mimeType: content.mimeType,
              text: content.text,
            },
          ],
        };
      }
    }
    throw new Error(`Resource not found: ${uri}`);
  });

  return server;
}

export async function startMcpServer(options: ServerOptions = {}): Promise<void> {
  const server = createMcpServer(options);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write(
    `[harness-mcp] started ${options.serverName ?? "harness-engineering-mcp"} v${options.serverVersion ?? "0.2.0"} on stdio\n`,
  );
}

if (process.argv[1] && /(?:^|[\\/])(?:mcp-server\.js|server\.ts)$/.test(process.argv[1])) {
  void startMcpServer();
}
