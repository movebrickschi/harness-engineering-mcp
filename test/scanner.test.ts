import { describe, expect, it } from "vitest";
import { resolve } from "node:path";
import { scanProject } from "../src/core/scanner/index.js";

const fixtureRoot = resolve(process.cwd(), "test/fixtures");

describe("scanProject", () => {
  it("detects Java Spring projects", async () => {
    const result = await scanProject({ cwd: resolve(fixtureRoot, "java-spring") });
    expect(result.stack).toBe("java-spring");
    expect(result.project_type).toBe("backend-service");
  });

  it("detects Node TypeScript projects", async () => {
    const result = await scanProject({ cwd: resolve(fixtureRoot, "node-typescript") });
    expect(result.stack).toBe("node-typescript");
    expect(result.project_name).toBe("node-typescript-fixture");
  });

  it("detects Python projects", async () => {
    const result = await scanProject({ cwd: resolve(fixtureRoot, "python") });
    expect(result.stack).toBe("python");
  });
});
