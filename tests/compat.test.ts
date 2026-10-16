import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { describe, expect, it } from "vitest";
import { evaluateAll, loadRules } from "../scripts/lib/compat.js";
import { FACT_KEYS, buildFacts } from "../scripts/lib/facts.js";
import { parseSkillMarkdown } from "../scripts/lib/frontmatter.js";
import type { RuleFile } from "../scripts/lib/types.js";
import { labeled } from "./fixtures/labeled.js";

describe("compatibility rules", () => {
  const rules = loadRules();

  it("loads one versioned file per agent", () => {
    expect(rules.map((rule) => rule.agent).sort()).toEqual([
      "claude-code",
      "codex",
      "hermes",
      "openclaw",
    ]);
    for (const rule of rules) {
      expect(rule.version).toBeGreaterThan(0);
      expect(rule.spec_url.startsWith("https://")).toBe(true);
      expect(rule.compatible_reason.length).toBeGreaterThan(20);
    }
  });

  it("only references known facts", () => {
    const known = new Set<string>(FACT_KEYS);
    for (const rule of rules) {
      for (const check of rule.checks) {
        expect(known.has(check.when), `${rule.agent} ${check.id}`).toBe(true);
      }
    }
  });

  it("matches 20 hand-labeled fixtures", () => {
    expect(labeled.length).toBeGreaterThanOrEqual(20);
    for (const fixture of labeled) {
      const facts = buildFacts(parseSkillMarkdown(fixture.markdown), false);
      const result = evaluateAll(facts, rules);
      for (const agent of Object.keys(fixture.expect) as Array<keyof typeof fixture.expect>) {
        expect(result[agent].status, `${fixture.id} ${agent}`).toBe(fixture.expect[agent]);
        expect(result[agent].reasons.length, `${fixture.id} ${agent} reasons`).toBeGreaterThan(0);
      }
    }
  });

  it("parses every rule file as YAML with checks", () => {
    const files = readdirSync("rules").filter((name) => name.endsWith(".yaml"));
    expect(files.length).toBe(4);
    for (const file of files) {
      const rule = parse(readFileSync(join("rules", file), "utf8")) as RuleFile;
      expect(rule.checks.length).toBeGreaterThan(3);
    }
  });
});
