import { describe, expect, it } from "vitest";
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { registerGateReviewTool } from "../src/mcp/tools/gate-review.js";

const ctx = (cwd: string) => ({ toolName: "harness_gate_review", cwd, startedAt: Date.now() });

describe("harness_gate_review", () => {
  it("generate creates an 8-dimension review file from the bundled template", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "gate-gen-"));
    try {
      const tool = registerGateReviewTool();
      const result = await tool.handler(
        { cwd, feature_name: "search-v2" },
        ctx(cwd),
      );
      expect(result.status).toBe("generated");
      expect(result.file_path).toBe(".harness/features/search-v2/03_GATE_REVIEW.md");
      expect(result.blockers).toEqual([]);

      const body = readFileSync(join(cwd, result.file_path), "utf-8");
      expect(body).toContain("Gate Review");
      expect(body).toContain("8 维度审查");
      expect(body).toContain("阻塞项（Blocker）");
      expect(body).toContain("Blockers");
      expect(body).toContain("(示例) 缺少回滚 SQL");
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it("generate keeps an existing file and reports a soft notice in blockers", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "gate-keep-"));
    try {
      const tool = registerGateReviewTool();
      mkdirSync(join(cwd, ".harness/features/search-v2"), { recursive: true });
      writeFileSync(
        join(cwd, ".harness/features/search-v2/03_GATE_REVIEW.md"),
        "# manual content\n",
      );

      const result = await tool.handler(
        { cwd, feature_name: "search-v2" },
        ctx(cwd),
      );
      expect(result.blockers[0]).toContain("existing file");
      expect(readFileSync(join(cwd, result.file_path), "utf-8")).toContain(
        "manual content",
      );
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it("check returns blocked when explicit BLOCKER bullets are present", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "gate-blocked-"));
    try {
      mkdirSync(join(cwd, ".harness/features/payment"), { recursive: true });
      writeFileSync(
        join(cwd, ".harness/features/payment/03_GATE_REVIEW.md"),
        [
          "# Gate Review",
          "## 3. 阻塞项（Blocker）",
          "| 编号 | 描述 | 退回阶段 | 必改原因 |",
          "| --- | --- | --- | --- |",
          "| B-1 | 缺少回滚 SQL | 方案 | 上线高风险 |",
          "",
          "## 6. 评审结论",
          "- [ ] 通过",
          "- [ ] 有条件通过",
          "- [x] 不通过",
          "",
          "- BLOCKER: 鉴权策略缺失",
        ].join("\n"),
      );

      const tool = registerGateReviewTool();
      const result = await tool.handler(
        { cwd, feature_name: "payment", action: "check" },
        ctx(cwd),
      );
      expect(result.status).toBe("blocked");
      expect(result.blockers).toContain("鉴权策略缺失");
      expect(result.blockers).toContain("缺少回滚 SQL");
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it("check returns passed only when no blockers and 通过 is checked", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "gate-passed-"));
    try {
      mkdirSync(join(cwd, ".harness/features/empty"), { recursive: true });
      writeFileSync(
        join(cwd, ".harness/features/empty/03_GATE_REVIEW.md"),
        [
          "# Gate Review",
          "## 3. 阻塞项（Blocker）",
          "| 编号 | 描述 | 退回阶段 | 必改原因 |",
          "| --- | --- | --- | --- |",
          "",
          "## 6. 评审结论",
          "- [x] 通过",
          "- [ ] 有条件通过",
          "- [ ] 不通过",
          "",
        ].join("\n"),
      );

      const tool = registerGateReviewTool();
      const result = await tool.handler(
        { cwd, feature_name: "empty", action: "check" },
        ctx(cwd),
      );
      expect(result.status).toBe("passed");
      expect(result.blockers).toEqual([]);
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it("check returns blocked when the review file is missing", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "gate-missing-"));
    try {
      const tool = registerGateReviewTool();
      const result = await tool.handler(
        { cwd, feature_name: "ghost", action: "check" },
        ctx(cwd),
      );
      expect(result.status).toBe("blocked");
      expect(result.blockers[0]).toContain("不存在");
      expect(existsSync(join(cwd, result.file_path))).toBe(false);
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });
});
