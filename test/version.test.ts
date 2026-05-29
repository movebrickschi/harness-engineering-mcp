import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { VERSION } from "../src/core/version.js";

const pkgPath = join(dirname(fileURLToPath(import.meta.url)), "..", "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as { version: string };

describe("VERSION single source of truth", () => {
  it("matches package.json version exactly", () => {
    expect(VERSION).toBe(pkg.version);
  });

  it("is a real semver, not the 0.0.0 fallback", () => {
    expect(VERSION).toMatch(/^\d+\.\d+\.\d+/);
    expect(VERSION).not.toBe("0.0.0");
  });
});
