import { parseSkillMarkdown } from "./frontmatter.js";
import type { GithubInfo, SkillRecord } from "./types.js";

export const MIN_CLAWHUB_DOWNLOADS = 1000;
export const MIN_GITHUB_STARS = 10;
export const STALE_MS = 540 * 24 * 60 * 60 * 1000;
export const RECENT_MS = 90 * 24 * 60 * 60 * 1000;

export function isStubMarkdown(text: string): boolean {
  const parsed = parseSkillMarkdown(text);
  const description =
    typeof parsed.frontmatter?.description === "string" ? parsed.frontmatter.description.trim() : "";
  return description.length < 20 || parsed.body.trim().length < 80;
}

export function clawhubKept(downloads: number): boolean {
  return downloads >= MIN_CLAWHUB_DOWNLOADS;
}

export function skillsShKept(info: GithubInfo | null, now = Date.now()): boolean {
  if (!info || info.archived || info.stars < MIN_GITHUB_STARS || !info.lastPush) return false;
  const pushed = Date.parse(info.lastPush);
  if (Number.isNaN(pushed)) return false;
  return now - pushed <= STALE_MS;
}

export function popularityValue(skill: SkillRecord): number {
  if (skill.registry?.source === "clawhub") return skill.registry.downloads;
  return skill.github?.stars ?? 0;
}

export function sourceKey(skill: SkillRecord): "clawhub" | "skills.sh" {
  if (skill.sources.some((source) => source.name === "clawhub") && skill.registry?.source === "clawhub") {
    return "clawhub";
  }
  return skill.sources.some((source) => source.name === "skills.sh") ? "skills.sh" : "clawhub";
}

export function scoreSkills(skills: SkillRecord[], now = Date.now()): SkillRecord[] {
  const maxLog: Record<"clawhub" | "skills.sh", number> = { clawhub: 1, "skills.sh": 1 };
  for (const skill of skills) {
    const key = sourceKey(skill);
    maxLog[key] = Math.max(maxLog[key], Math.log10(1 + popularityValue(skill)));
  }
  return skills.map((skill) => {
    const key = sourceKey(skill);
    const popularity = (Math.log10(1 + popularityValue(skill)) / maxLog[key]) * 70;
    const qualityScore = Math.max(
      0,
      Math.round(popularity + recencyBonus(skill, now) + descriptionBonus(skill) - flagPenalty(skill)),
    );
    return { ...skill, qualityScore };
  });
}

export function sortByQuality(skills: SkillRecord[]): SkillRecord[] {
  return [...skills].sort(
    (a, b) => b.qualityScore - a.qualityScore || a.name.localeCompare(b.name) || a.id.localeCompare(b.id),
  );
}

function recencyBonus(skill: SkillRecord, now: number): number {
  const raw = skill.updatedAt || skill.github?.lastPush;
  if (!raw) return 0;
  const time = Date.parse(raw);
  if (Number.isNaN(time)) return 0;
  const age = now - time;
  if (age <= RECENT_MS) return 20;
  if (age <= STALE_MS) return 12;
  return 0;
}

function descriptionBonus(skill: SkillRecord): number {
  const text = skill.description.trim();
  if (text.length < 40) return 0;
  if (text.startsWith("No description in the frontmatter")) return 0;
  return 10;
}

function flagPenalty(skill: SkillRecord): number {
  return Math.min(40, skill.scan.flags.length * 15);
}
