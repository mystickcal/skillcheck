import { describe, expect, it } from "vitest";
import { bestTopics, installHints, resolvePicks } from "../src/lib/best";
import { skills } from "../src/lib/skills";
import type { SkillRecord } from "../scripts/lib/types.ts";

describe("best skills lists", () => {
  it("has unique slugs and 5 to 10 picks per topic with no repeats", () => {
    const slugs = bestTopics.map((topic) => topic.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const topic of bestTopics) {
      expect(topic.slug).toMatch(/^[a-z0-9-]+$/);
      expect(topic.picks.length).toBeGreaterThanOrEqual(5);
      expect(topic.picks.length).toBeLessThanOrEqual(10);
      const ids = topic.picks.map((pick) => pick.id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(topic.description.length).toBeLessThanOrEqual(160);
      for (const pick of topic.picks) expect(pick.note.length).toBeGreaterThan(20);
    }
  });

  it("keeps enough picks in the current catalog for every page", () => {
    // Nightly ingest can drop or flag a skill. The page hides those, so the floor is lower than the list size.
    for (const topic of bestTopics) {
      expect(resolvePicks(topic).length, topic.slug).toBeGreaterThanOrEqual(3);
    }
  });

  it("drops picks that are missing or carry a scan flag", () => {
    const sample = skills.find((skill) => skill.id === bestTopics[0].picks[0].id) as SkillRecord;
    const flagged = { ...sample, scan: { label: "flags found", flags: [{ id: "x", summary: "x" }] } } as unknown as SkillRecord;
    const catalog = new Map([[sample.id, flagged]]);
    expect(resolvePicks(bestTopics[0], catalog)).toEqual([]);
  });

  it("builds install commands the way each registry shows them", () => {
    const base = skills[0];
    const claw = { ...base, sourceUrl: "https://clawhub.ai/pskoett/skills/self-improving-agent", repo: null } as SkillRecord;
    expect(installHints(claw).map((hint) => hint.command)).toEqual([
      "openclaw skills install @pskoett/self-improving-agent",
      "clawhub install @pskoett/self-improving-agent",
    ]);
    const sh = { ...base, sourceUrl: "https://www.skills.sh/mattpocock/skills/tdd", repo: "https://github.com/mattpocock/skills" } as SkillRecord;
    expect(installHints(sh).map((hint) => hint.command)).toEqual([
      "npx skills add https://github.com/mattpocock/skills --skill tdd",
    ]);
  });

  it("gives every list a unique title and description with no em dashes in the copy", () => {
    const titles = bestTopics.map((topic) => topic.title);
    const descriptions = bestTopics.map((topic) => topic.description);
    expect(new Set(titles).size).toBe(titles.length);
    expect(new Set(descriptions).size).toBe(descriptions.length);
    for (const topic of bestTopics) {
      const copy = [topic.label, topic.title, topic.description, topic.intro, ...topic.picks.map((pick) => pick.note)].join(" ");
      expect(copy, topic.slug).not.toContain("\u2014");
    }
  });
});
