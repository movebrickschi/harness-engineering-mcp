import { describe, expect, it } from "vitest";
import { registerRulesResources } from "../src/mcp/resources/rules.js";
import { registerSkillsResources } from "../src/mcp/resources/skills.js";
import { registerSpecResources } from "../src/mcp/resources/spec.js";
import { registerTemplatesResources } from "../src/mcp/resources/templates.js";
import { registerLoadSkillTool } from "../src/mcp/tools/load-skill.js";

describe("M3 resources and skill loading", () => {
  it("loads the skill selected by a route result", async () => {
    const tool = registerLoadSkillTool();
    const result = await tool.handler(
      { name: "dev-flow-oneliner-fe" },
      { toolName: "harness_load_skill", cwd: process.cwd(), startedAt: Date.now() },
    );

    expect(result.content).toContain("一句话前端需求");
    expect(result.version).toBe("0.1.0");
  });

  it("lists and reads spec, skills, rules, templates, schema, and stack adapters", async () => {
    const spec = registerSpecResources();
    const skills = registerSkillsResources();
    const rules = registerRulesResources();
    const templates = registerTemplatesResources();

    expect(spec.list().some((item) => item.uri === "harness://spec/index")).toBe(true);
    expect((await spec.read("harness://spec/index")).text).toContain("Engineering Harness Spec Index");

    expect(skills.list().some((item) => item.uri === "harness://skills/dev-flow")).toBe(true);
    expect((await skills.read("harness://skills/dev-flow")).text).toContain("开发组合拳");

    expect(rules.list().some((item) => item.uri.startsWith("harness://rules/"))).toBe(true);
    expect((await rules.read("harness://rules/index")).text).toContain("rules");

    expect(templates.list().some((item) => item.uri === "harness://config/schema")).toBe(true);
    expect((await templates.read("harness://config/schema")).text).toContain("harness.config");
    expect((await templates.read("harness://stack-adapters/node-typescript")).text).toContain(
      "Node",
    );
  });
});
