import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type {
  DetectionEvidence,
  HarnessStack,
  HarnessProjectType,
  InitDetected,
  HarnessMode,
} from "../../types/harness.js";

const STACK_MARKERS: Array<{ file: string; stack: HarnessStack; weight: number; signal: string }> =
  [
    { file: "pom.xml", stack: "java-spring", weight: 30, signal: "Maven pom.xml present" },
    {
      file: "build.gradle.kts",
      stack: "java-spring",
      weight: 25,
      signal: "Gradle Kotlin DSL present",
    },
    { file: "build.gradle", stack: "java-spring", weight: 25, signal: "Gradle Groovy DSL present" },
    {
      file: "package.json",
      stack: "node-typescript",
      weight: 30,
      signal: "package.json present",
    },
    {
      file: "tsconfig.json",
      stack: "node-typescript",
      weight: 15,
      signal: "tsconfig.json present",
    },
    {
      file: "pyproject.toml",
      stack: "python",
      weight: 30,
      signal: "pyproject.toml present",
    },
    {
      file: "requirements.txt",
      stack: "python",
      weight: 25,
      signal: "requirements.txt present",
    },
    { file: "setup.py", stack: "python", weight: 20, signal: "setup.py present" },
    { file: "go.mod", stack: "go", weight: 35, signal: "go.mod present" },
  ];

export interface ScannerInput {
  cwd: string;
}

export async function scanProject(input: ScannerInput): Promise<InitDetected> {
  const { cwd } = input;
  const evidence: DetectionEvidence[] = [];
  const stackVotes = new Map<HarnessStack, number>();

  for (const marker of STACK_MARKERS) {
    const abs = join(cwd, marker.file);
    if (existsSync(abs)) {
      stackVotes.set(marker.stack, (stackVotes.get(marker.stack) ?? 0) + marker.weight);
      evidence.push({
        source: marker.file,
        signal: marker.signal,
        weight: marker.weight,
      });
    }
  }

  let stack: HarnessStack | null = null;
  let topVotes = 0;
  for (const [s, v] of stackVotes) {
    if (v > topVotes) {
      stack = s;
      topVotes = v;
    }
  }

  let projectName: string | null = null;
  if (existsSync(join(cwd, "package.json"))) {
    try {
      const pkg = JSON.parse(readFileSync(join(cwd, "package.json"), "utf-8")) as {
        name?: string;
      };
      if (typeof pkg.name === "string") projectName = pkg.name;
    } catch {
      /* ignore */
    }
  }
  if (!projectName) {
    projectName = cwd.split(/[\\/]/).filter(Boolean).pop() ?? null;
  }

  const projectType = inferProjectType(cwd, stack);
  if (projectType) {
    evidence.push({
      source: "src-structure",
      signal: `inferred project type ${projectType}`,
      weight: 10,
    });
  }

  const modeSuggestion: HarnessMode = "solo";

  const confidence = Math.min(1, topVotes / 50);

  return {
    stack,
    project_type: projectType,
    mode_suggestion: modeSuggestion,
    project_name: projectName,
    evidence,
    confidence,
  };
}

function inferProjectType(
  cwd: string,
  stack: HarnessStack | null,
): HarnessProjectType | null {
  if (existsSync(join(cwd, "public/index.html")) || existsSync(join(cwd, "index.html"))) {
    return "frontend-spa";
  }
  if (stack === "java-spring") return "backend-service";
  if (stack === "go") return "backend-service";
  if (stack === "python") {
    if (existsSync(join(cwd, "setup.py")) || existsSync(join(cwd, "pyproject.toml"))) {
      return "library";
    }
    return "backend-service";
  }
  if (stack === "node-typescript") {
    try {
      const pkg = JSON.parse(readFileSync(join(cwd, "package.json"), "utf-8")) as {
        bin?: unknown;
      };
      if (pkg.bin) return "cli";
    } catch {
      /* ignore */
    }
    return "library";
  }
  return null;
}
