import { createHash } from "node:crypto";
import { evaluateAll, loadRules } from "./compat.js";
import { buildFacts } from "./facts.js";
import { parseSkillMarkdown, stringList } from "./frontmatter.js";
import { healthFor } from "./health.js";
import { scanTexts } from "./scan.js";
import type { GithubInfo, RegistryStat, RuleFile, SkillRecord, SkillSource } from "./types.js";

let cachedRules: RuleFile[] | null = null;

function rules(): RuleFile[] {
  cachedRules ??= loadRules();
  return cachedRules;
}

export function analyzeSkill(input: {
  text: string;
  scriptTexts?: string[];
  hasScriptsDir?: boolean;
  fallbackName: string;
  sourceUrl: string;
  repo: string | null;
  path: string;
  author: string | null;
  tags?: string[];
  sources: SkillSource[];
  github?: GithubInfo | null;
  registry?: RegistryStat | null;
  id: string;
  now?: string;
  updatedAt?: string | null;
}): SkillRecord {
  const parsed = parseSkillMarkdown(input.text);
  const facts = buildFacts(parsed, Boolean(input.hasScriptsDir));
  const fmName = typeof parsed.frontmatter?.name === "string" ? parsed.frontmatter.name.trim() : "";
  const fmDescription =
    typeof parsed.frontmatter?.description === "string" ? parsed.frontmatter.description.trim() : "";
  const fmAuthor = typeof parsed.frontmatter?.author === "string" ? parsed.frontmatter.author.trim() : "";
  const hermesTags = stringList(
    (parsed.frontmatter?.metadata as { hermes?: { tags?: unknown } } | undefined)?.hermes?.tags,
  );
  const tags = unique([...(input.tags ?? []), ...hermesTags]);
  const description = clip(fmDescription || firstLine(parsed.body) || "No description in the frontmatter.", 1024);
  const github = input.github ?? null;
  return {
    id: input.id,
    name: clip(fmName || input.fallbackName, 80),
    description,
    sourceUrl: input.sourceUrl,
    repo: input.repo,
    path: input.path,
    author: fmAuthor || input.author,
    tags,
    category: tags[0]?.toLowerCase() || "uncategorized",
    frontmatterKeys: parsed.keys,
    sources: input.sources,
    bins: facts.bins,
    env: facts.env,
    tools: facts.tools,
    hasScriptsDir: facts.has_scripts_dir,
    mentionsNetwork: facts.mentions_network,
    compatibility: evaluateAll(facts, rules()),
    github,
    health: healthFor(github),
    scan: scanTexts([input.text, ...(input.scriptTexts ?? [])]),
    registry: input.registry ?? null,
    contentSha: createHash("sha256").update(input.text).digest("hex"),
    analyzedAt: input.now ?? new Date().toISOString(),
    updatedAt: input.updatedAt ?? null,
    qualityScore: 0,
  };
}

export function dedupeKey(record: Pick<SkillRecord, "repo" | "path" | "sourceUrl">): string {
  if (record.repo) return `${normalizeRepo(record.repo)}|${record.path.replace(/\\/g, "/")}`;
  return `url|${record.sourceUrl.replace(/\/+$/, "").toLowerCase()}|${record.path}`;
}

export function dedupeSkills(records: SkillRecord[]): SkillRecord[] {
  const byKey = new Map<string, SkillRecord>();
  for (const record of records) {
    const key = dedupeKey(record);
    const existing = byKey.get(key);
    byKey.set(key, existing ? mergeRecords(existing, record) : record);
  }
  return [...byKey.values()].sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
}

function mergeRecords(left: SkillRecord, right: SkillRecord): SkillRecord {
  const primary = left.repo ? left : right.repo ? right : left;
  const secondary = primary === left ? right : left;
  const sources = uniqueSources([...primary.sources, ...secondary.sources]);
  return {
    ...primary,
    tags: unique([...primary.tags, ...secondary.tags]),
    sources,
    registry: primary.registry ?? secondary.registry,
    github: primary.github ?? secondary.github,
    health: primary.github ? primary.health : secondary.health,
  };
}

export function normalizeRepo(repo: string): string {
  const trimmed = repo.trim().replace(/\.git$/, "").replace(/\/+$/, "");
  const match = trimmed.match(/github\.com[:/]([^/]+)\/([^/]+)$/i);
  if (match) return `https://github.com/${match[1].toLowerCase()}/${match[2].toLowerCase()}`;
  return trimmed.toLowerCase();
}

export function makeId(parts: string[]): string {
  const slug = parts
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug.slice(0, 80) || "skill";
}

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function uniqueSources(sources: SkillSource[]): SkillSource[] {
  const seen = new Set<string>();
  const result: SkillSource[] = [];
  for (const source of sources) {
    const key = `${source.name}|${source.url}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(source);
  }
  return result;
}

function clip(value: string, max: number): string {
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 3).trimEnd()}...`;
}

function firstLine(body: string): string {
  const line = body
    .split("\n")
    .map((item) => item.replace(/^#+\s*/, "").trim())
    .find(Boolean);
  return line ?? "";
}
