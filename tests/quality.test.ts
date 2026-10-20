import { describe, expect, it } from "vitest";
import { analyzeSkill } from "../scripts/lib/record.js";
import {
  clawhubKept,
  isStubMarkdown,
  scoreSkills,
  skillsShKept,
  sortByQuality,
} from "../scripts/lib/quality.js";
import type { GithubInfo, SkillRecord } from "../scripts/lib/types.js";

const now = Date.parse("2026-10-20T00:00:00Z");

function skill(partial: Partial<SkillRecord> & Pick<SkillRecord, "id" | "name">): SkillRecord {
  const base = analyzeSkill({
    text: "---\nname: example\ndescription: A clear description of what this skill does for the user.\n---\n" + "Use the steps in this skill.\n".repeat(8),
    fallbackName: partial.name,
    sourceUrl: "https://example.com/skill",
    repo: null,
    path: "SKILL.md",
    author: null,
    sources: partial.sources ?? [{ name: "clawhub", url: "https://clawhub.ai/a/skills/example" }],
    id: partial.id,
    now: "2026-10-20T00:00:00Z",
  });
  return { ...base, ...partial };
}

describe("quality filters", () => {
  it("drops stub files and low ClawHub download counts", () => {
    expect(isStubMarkdown("---\nname: x\ndescription: short\n---\nHi\n")).toBe(true);
    expect(
      isStubMarkdown(
        "---\nname: x\ndescription: A useful description of the task.\n---\n" + "Step one and step two.\n".repeat(8),
      ),
    ).toBe(false);
    expect(clawhubKept(999)).toBe(false);
    expect(clawhubKept(1000)).toBe(true);
  });

  it("keeps skills.sh repos with stars, a recent push, and no archive flag", () => {
    const fresh: GithubInfo = {
      stars: 10,
      lastPush: "2026-06-01T00:00:00Z",
      openIssuesAndPullRequests: 0,
      license: "MIT",
      archived: false,
    };
    expect(skillsShKept(fresh, now)).toBe(true);
    expect(skillsShKept({ ...fresh, stars: 9 }, now)).toBe(false);
    expect(skillsShKept({ ...fresh, archived: true }, now)).toBe(false);
    expect(skillsShKept({ ...fresh, lastPush: "2024-01-01T00:00:00Z" }, now)).toBe(false);
  });

  it("scores a popular recent skill above a flagged one in the same source", () => {
    const popular = skill({
      id: "popular",
      name: "popular",
      registry: { source: "clawhub", downloads: 50000, stars: 10 },
      updatedAt: "2026-10-01T00:00:00Z",
      scan: { label: "scanned, no flags", flags: [] },
    });
    const flagged = skill({
      id: "flagged",
      name: "flagged",
      registry: { source: "clawhub", downloads: 50000, stars: 10 },
      updatedAt: "2026-10-01T00:00:00Z",
      scan: { label: "scanned, flags found", flags: [{ id: "pipe-to-shell", summary: "Pipe to a shell." }] },
    });
    const [first, second] = sortByQuality(scoreSkills([flagged, popular], now));
    expect(first.id).toBe("popular");
    expect(first.qualityScore).toBeGreaterThan(second.qualityScore);
    expect(first.qualityScore).toBeLessThanOrEqual(100);
    expect(second.qualityScore).toBeGreaterThanOrEqual(0);
  });
});
