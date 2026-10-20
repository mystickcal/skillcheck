import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

type Skill = {
  sourceUrl: string;
  sources: Array<{ name: string; url: string }>;
  compatibility: Record<string, { status: string; reasons: string[] }>;
  github: { stars: number; lastPush: string | null } | null;
};

const agents = ["hermes", "openclaw", "claude-code", "codex"];

describe("committed catalog", () => {
  const skills = JSON.parse(readFileSync("data/skills.json", "utf8")) as Skill[];

  it("has at least 500 skills from ClawHub and skills.sh", () => {
    expect(skills.length).toBeGreaterThanOrEqual(500);
    const names = new Set(skills.flatMap((skill) => skill.sources.map((source) => source.name)));
    expect(names.has("clawhub")).toBe(true);
    expect(names.has("skills.sh")).toBe(true);
    for (const skill of skills) {
      expect(skill.sourceUrl.startsWith("https://")).toBe(true);
      for (const agent of agents) {
        expect(["compatible", "likely", "needs_changes"]).toContain(skill.compatibility[agent].status);
        expect(skill.compatibility[agent].reasons.length).toBeGreaterThan(0);
      }
    }
  });

  it("keeps GitHub stars and last push on skills.sh repos", () => {
    const enriched = skills.filter((skill) => skill.github);
    expect(enriched.length).toBeGreaterThan(0);
    for (const skill of enriched) {
      expect(typeof skill.github?.stars).toBe("number");
      expect(skill.github?.lastPush === null || typeof skill.github?.lastPush === "string").toBe(true);
    }
  });
});
