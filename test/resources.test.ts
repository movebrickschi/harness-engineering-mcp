import { describe, expect, it } from "vitest";
import { registerRulesResources } from "../src/mcp/resources/rules.js";
import { registerSkillsResources } from "../src/mcp/resources/skills.js";
import { registerSpecResources } from "../src/mcp/resources/spec.js";
import { registerTemplatesResources } from "../src/mcp/resources/templates.js";
import { registerLoadSkillTool } from "../src/mcp/tools/load-skill.js";

describe("M3 spec resources", () => {
  const provider = registerSpecResources();

  it("exposes an index plus every spec file URI", () => {
    const items = provider.list();
    expect(items.some((i) => i.uri === "harness://spec/index")).toBe(true);
    expect(
      items.some((i) => i.uri === "harness://spec/file/01-people-and-collaboration.md"),
    ).toBe(true);
    expect(
      items.some((i) => i.uri === "harness://spec/file/harness.config.schema.json"),
    ).toBe(true);
  });

  it("renders an index containing the 6 numbered spec files", async () => {
    const text = (await provider.read("harness://spec/index")).text;
    expect(text).toContain("Engineering Harness Spec Index");
    expect(text).toContain("01-people-and-collaboration.md");
    expect(text).toContain("06-knowledge-and-memory.md");
  });

  it("returns markdown for spec files and application/json for schema", async () => {
    const md = await provider.read("harness://spec/file/01-people-and-collaboration.md");
    expect(md.mimeType).toBe("text/markdown");
    expect(md.text.length).toBeGreaterThan(0);

    const schema = await provider.read("harness://spec/file/harness.config.schema.json");
    expect(schema.mimeType).toBe("application/json");
    expect(schema.text).toContain("harness.config");
  });

  it("throws when a spec file is missing", async () => {
    await expect(
      provider.read("harness://spec/file/does-not-exist.md"),
    ).rejects.toThrow(/Spec file not found/);
  });
});

describe("M3 skills resources", () => {
  const provider = registerSkillsResources();

  it("lists an index plus every built-in skill URI", () => {
    const items = provider.list();
    expect(items.some((i) => i.uri === "harness://skills/index")).toBe(true);
    expect(items.some((i) => i.uri === "harness://skills/dev-flow")).toBe(true);
    expect(items.some((i) => i.uri === "harness://skills/bugfix-flow")).toBe(true);
    expect(items.some((i) => i.uri === "harness://skills/perf-flow")).toBe(true);
    expect(items.some((i) => i.uri === "harness://skills/third-party-flow")).toBe(true);
  });

  it("returns JSON for the index with metadata for each skill", async () => {
    const body = await provider.read("harness://skills/index");
    expect(body.mimeType).toBe("application/json");
    const parsed = JSON.parse(body.text) as { skills: Array<{ name: string; hasSkillMd: boolean }> };
    expect(parsed.skills.length).toBeGreaterThanOrEqual(18);
    const dev = parsed.skills.find((s) => s.name === "dev-flow");
    expect(dev?.hasSkillMd).toBe(true);
  });

  it("returns markdown body for an individual skill", async () => {
    const body = await provider.read("harness://skills/dev-flow-oneliner-fe");
    expect(body.mimeType).toBe("text/markdown");
    expect(body.text).toContain("一句话前端需求");
  });

  it("throws on an unknown skill", async () => {
    await expect(provider.read("harness://skills/does-not-exist")).rejects.toThrow(
      /Skill not found/,
    );
  });
});

describe("M3 rules resources", () => {
  const provider = registerRulesResources();

  it("lists an index plus every .mdc rule file", () => {
    const items = provider.list();
    expect(items.some((i) => i.uri === "harness://rules/index")).toBe(true);
    expect(
      items.some((i) => i.uri === "harness://rules/01-post-coding-doc-generation.mdc"),
    ).toBe(true);
    expect(items.filter((i) => i.uri.endsWith(".mdc")).length).toBeGreaterThanOrEqual(10);
  });

  it("renders an index containing the rule file list", async () => {
    const body = await provider.read("harness://rules/index");
    expect(body.mimeType).toBe("application/json");
    const parsed = JSON.parse(body.text) as { rules: string[] };
    expect(parsed.rules).toContain("01-post-coding-doc-generation.mdc");
    expect(parsed.rules.length).toBeGreaterThanOrEqual(10);
  });

  it("returns markdown for an individual rule", async () => {
    const body = await provider.read("harness://rules/05-chinese-comments.mdc");
    expect(body.mimeType).toBe("text/markdown");
    expect(body.text.length).toBeGreaterThan(0);
  });

  it("throws on an unknown rule", async () => {
    await expect(provider.read("harness://rules/nope.mdc")).rejects.toThrow(
      /Rule not found/,
    );
  });
});

describe("M3 templates resources", () => {
  const provider = registerTemplatesResources();

  it("lists templates index, config schema, and stack adapters", () => {
    const items = provider.list();
    expect(items.some((i) => i.uri === "harness://templates/index")).toBe(true);
    expect(items.some((i) => i.uri === "harness://config/schema")).toBe(true);
    expect(items.some((i) => i.uri === "harness://stack-adapters/java-spring")).toBe(true);
    expect(items.some((i) => i.uri === "harness://stack-adapters/node-typescript")).toBe(true);
    expect(items.some((i) => i.uri === "harness://stack-adapters/python")).toBe(true);
    expect(
      items.some((i) =>
        i.uri.startsWith("harness://templates/entry/engineering-check.ps1.hbs"),
      ),
    ).toBe(true);
  });

  it("returns application/json for the config schema", async () => {
    const body = await provider.read("harness://config/schema");
    expect(body.mimeType).toBe("application/json");
    expect(body.text).toContain("harness.config");
  });

  it("returns markdown for stack adapter files", async () => {
    const body = await provider.read("harness://stack-adapters/node-typescript");
    expect(body.mimeType).toBe("text/markdown");
    expect(body.text).toContain("Node");
  });

  it("reads a concrete template file", async () => {
    const body = await provider.read(
      "harness://templates/entry/harness.config.solo.json",
    );
    expect(body.mimeType).toBe("application/json");
    expect(body.text).toContain("project");
  });

  it("throws on unknown stack adapter or template", async () => {
    await expect(provider.read("harness://stack-adapters/nope")).rejects.toThrow(
      /Stack adapter not found/,
    );
    await expect(provider.read("harness://templates/nope.md")).rejects.toThrow(
      /Template not found/,
    );
  });
});

describe("M3 load-skill tool", () => {
  it("loads the skill selected by a route result", async () => {
    const tool = registerLoadSkillTool();
    const result = await tool.handler(
      { name: "dev-flow-oneliner-fe" },
      { toolName: "harness_load_skill", cwd: process.cwd(), startedAt: Date.now() },
    );

    expect(result.content).toContain("一句话前端需求");
    expect(result.version).toBe("0.1.0");
  });

  it("errors on an unknown skill name", async () => {
    const tool = registerLoadSkillTool();
    await expect(
      tool.handler(
        { name: "definitely-not-a-skill" },
        { toolName: "harness_load_skill", cwd: process.cwd(), startedAt: Date.now() },
      ),
    ).rejects.toThrow(/Skill not found/);
  });
});
