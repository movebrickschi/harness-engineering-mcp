import { describe, expect, it } from "vitest";
import { routeTask } from "../src/core/router/index.js";

describe("routeTask", () => {
  it("routes bug reports to bugfix-flow", async () => {
    const result = await routeTask({ task: "接口 500 报错，帮我修 bug" });
    expect(result.skill).toBe("bugfix-flow");
  });

  it("routes frontend one-liners to frontend skill", async () => {
    const result = await routeTask({ task: "列表加一个状态筛选" });
    expect(result.skill).toBe("dev-flow-oneliner-fe");
  });

  it("forces upgrade for database schema changes", async () => {
    const result = await routeTask({ task: "后端新增订单表和查询接口" });
    expect(result.forced_upgrade?.reason).toContain("数据库");
    expect(result.modifiers).toContain("M4");
  });

  it("keeps UI and integration modifiers in route output", async () => {
    const ui = await routeTask({ task: "没有设计稿，做一个设置页面" });
    expect(ui.skill).toBe("dev-flow-oneliner-fe");
    expect(ui.modifiers).toContain("M2");

    const integration = await routeTask({ task: "只联调后端订单接口和前端列表" });
    expect(integration.skill).toBe("dev-flow-oneliner-full");
    expect(integration.modifiers).toContain("M5");
  });

  it("returns efficiency hints aligned with skill and modifiers", async () => {
    const bugfix = await routeTask({ task: "接口 500 报错，帮我修 bug" });
    expect(bugfix.efficiency_hints.length).toBeGreaterThanOrEqual(3);
    expect(bugfix.efficiency_hints.some((h) => h.includes("根因"))).toBe(true);
    expect(bugfix.efficiency_hints[bugfix.efficiency_hints.length - 1]).toMatch(
      /回复 < 2000 字符/,
    );

    const dbTask = await routeTask({ task: "后端新增订单表和查询接口" });
    expect(dbTask.efficiency_hints.some((h) => h.includes("DB schema"))).toBe(true);
    expect(dbTask.efficiency_hints.some((h) => h.includes("强制升级"))).toBe(true);

    const oneliner = await routeTask({ task: "列表加一个状态筛选" });
    expect(oneliner.efficiency_hints.some((h) => h.includes("小需求"))).toBe(true);
  });

  it("routes 8 representative M3 scenarios", async () => {
    await expect(routeTask({ task: "接口 500 报错" })).resolves.toMatchObject({ skill: "bugfix-flow" });
    await expect(routeTask({ task: "整理 service 层代码" })).resolves.toMatchObject({ skill: "refactor-flow" });
    await expect(routeTask({ task: "页面加载太慢，做性能优化" })).resolves.toMatchObject({ skill: "perf-flow" });
    await expect(routeTask({ task: "接入 Stripe webhook" })).resolves.toMatchObject({ skill: "third-party-flow" });
    await expect(routeTask({ task: "按 PRD 做前端页面", context: { has_prd: true, scope: "frontend" } })).resolves.toMatchObject({ skill: "dev-flow-doc-fe" });
    await expect(routeTask({ task: "参考原型实现后端接口", context: { has_prototype: true, scope: "backend" } })).resolves.toMatchObject({ skill: "dev-flow-proto-be" });
    await expect(routeTask({ task: "列表加状态筛选" })).resolves.toMatchObject({ skill: "dev-flow-oneliner-fe" });
    await expect(routeTask({ task: "后端查询接口加一个字段" })).resolves.toMatchObject({ skill: "dev-flow-oneliner-be" });
  });
});
