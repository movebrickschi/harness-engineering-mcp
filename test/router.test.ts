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
  });
});
