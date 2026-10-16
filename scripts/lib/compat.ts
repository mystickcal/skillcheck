import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import type { AgentId, Effect, Facts, RuleFile, Status } from "./types.js";

const RANK: Record<Effect, number> = {
  info: 0,
  compatible: 1,
  likely: 2,
  needs_changes: 3,
};

export function loadRules(dir = defaultRulesDir()): RuleFile[] {
  return readdirSync(dir)
    .filter((name) => name.endsWith(".yaml"))
    .sort()
    .map((name) => parse(readFileSync(join(dir, name), "utf8")) as RuleFile);
}

export function evaluateAgent(
  facts: Facts,
  rule: RuleFile,
): { status: Status; reasons: string[] } {
  const fired = rule.checks.filter((check) => factOn(facts, check.when));
  let status: Status = "compatible";
  for (const check of fired) {
    if (check.effect !== "info" && RANK[check.effect] > RANK[status]) {
      status = check.effect;
    }
  }
  const reasons =
    status === "compatible"
      ? [rule.compatible_reason, ...fired.filter((check) => check.effect === "info").map((check) => check.reason)]
      : fired.filter((check) => check.effect === status).map((check) => check.reason);
  return { status, reasons };
}

export function evaluateAll(
  facts: Facts,
  rules: RuleFile[],
): Record<AgentId, { status: Status; reasons: string[] }> {
  const result = {} as Record<AgentId, { status: Status; reasons: string[] }>;
  for (const rule of rules) {
    result[rule.agent] = evaluateAgent(facts, rule);
  }
  return result;
}

function factOn(facts: Facts, key: string): boolean {
  const value = (facts as Record<string, boolean | string[]>)[key];
  return value === true;
}

function defaultRulesDir(): string {
  return join(dirname(fileURLToPath(import.meta.url)), "../../rules");
}
