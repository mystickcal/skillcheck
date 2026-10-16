import { mkdirSync, writeFileSync } from "node:fs";
import { cachedRecord, loadAnalysisCache, saveAnalysisCache, storeRecord } from "./lib/analysis-cache.js";
import { listClawhub, fetchClawhubSkill, clawhubPageUrl } from "./lib/clawhub.js";
import { loadRules } from "./lib/compat.js";
import { fetchRaw, loadGithubCache, loadRepo, matchSkillPath, saveGithubCache, scriptPaths } from "./lib/github.js";
import { healthFor } from "./lib/health.js";
import { analyzeSkill, dedupeSkills, makeId } from "./lib/record.js";
import { listSkillsSh } from "./lib/skillssh.js";
import type { SkillRecord } from "./lib/types.js";

const clawhubMax = numberEnv("INGEST_CLAWHUB_MAX", 24);
const skillsShMax = numberEnv("INGEST_SKILLSSH_MAX", 12);

async function main(): Promise<void> {
  const records: SkillRecord[] = [];
  const cache = loadGithubCache();
  const analysis = loadAnalysisCache();
  const rulesVersion = loadRules().map((rule) => `${rule.agent}@${rule.version}`).join(",");
  records.push(...(await ingestClawhub()));
  records.push(...(await ingestSkillsSh(cache, analysis, rulesVersion)));
  saveGithubCache(cache);
  saveAnalysisCache(analysis);
  const skills = dedupeSkills(records);
  if (skills.length === 0) throw new Error("Ingest produced no skills. Existing data was left untouched.");
  mkdirSync("data", { recursive: true });
  writeFileSync("data/skills.json", `${JSON.stringify(skills, null, 2)}\n`);
  console.log(`Wrote ${skills.length} skills to data/skills.json`);
}

async function ingestClawhub(): Promise<SkillRecord[]> {
  if (clawhubMax <= 0) return [];
  const items = await listClawhub(clawhubMax);
  const records: SkillRecord[] = [];
  for (const item of items) {
    const pageUrl = clawhubPageUrl(item);
    if (!pageUrl || !item.slug) continue;
    const text = await fetchClawhubSkill(item);
    if (!text || !text.includes("---")) continue;
    records.push(
      analyzeSkill({
        text,
        fallbackName: item.displayName || item.slug,
        sourceUrl: pageUrl,
        repo: null,
        path: "SKILL.md",
        author: item.ownerHandle ?? null,
        tags: item.topics ?? [],
        sources: [{ name: "clawhub", url: pageUrl }],
        registry: {
          source: "clawhub",
          downloads: item.stats?.downloads ?? 0,
          stars: item.stats?.stars ?? 0,
        },
        id: makeId(["claw", item.ownerHandle ?? "owner", item.slug]),
      }),
    );
  }
  console.log(`ClawHub skills analyzed: ${records.length}`);
  return records;
}

async function ingestSkillsSh(
  cache: ReturnType<typeof loadGithubCache>,
  analysis: ReturnType<typeof loadAnalysisCache>,
  rulesVersion: string,
): Promise<SkillRecord[]> {
  if (skillsShMax <= 0) return [];
  const listings = await listSkillsSh(skillsShMax * 4);
  const records: SkillRecord[] = [];
  const byRepo = new Map<string, typeof listings>();
  for (const listing of listings) {
    const group = byRepo.get(listing.repoUrl) ?? [];
    group.push(listing);
    byRepo.set(listing.repoUrl, group);
  }
  for (const [repoUrl, group] of byRepo) {
    if (records.length >= skillsShMax) break;
    let repo: Awaited<ReturnType<typeof loadRepo>>;
    try {
      repo = await loadRepo(repoUrl, cache);
    } catch (error) {
      console.warn(`Skipped ${repoUrl}: ${(error as Error).message}`);
      continue;
    }
    if (!repo) continue;
    for (const listing of group) {
      if (records.length >= skillsShMax) break;
      const path = matchSkillPath(repo.files, listing.slug);
      if (!path) continue;
      const blob = repo.files.find((file) => file.path === path);
      const cacheKey = `${repoUrl}|${path}`;
      const previous = blob ? cachedRecord(analysis, cacheKey, blob.sha, rulesVersion) : null;
      if (previous) {
        records.push({ ...previous, github: repo.info, health: healthFor(repo.info) });
        continue;
      }
      const text = await fetchRaw(repoUrl, path);
      if (!text) continue;
      const scriptsToRead = scriptPaths(repo.files, path);
      const scripts: string[] = [];
      for (const scriptPath of scriptsToRead) {
        const script = await fetchRaw(repoUrl, scriptPath);
        if (script) scripts.push(script);
      }
      const record = analyzeSkill({
          text,
          scriptTexts: scripts,
          hasScriptsDir: scriptsToRead.length > 0,
          fallbackName: listing.slug,
          sourceUrl: listing.pageUrl,
          repo: repoUrl,
          path,
          author: listing.owner,
          sources: [{ name: "skills.sh", url: listing.pageUrl }],
          github: repo.info,
          id: makeId(["gh", listing.owner, listing.repo, path.replace(/\/SKILL\.md$/, "")]),
      });
      if (blob) storeRecord(analysis, cacheKey, blob.sha, rulesVersion, record);
      records.push(record);
    }
  }
  console.log(`skills.sh skills analyzed: ${records.length}`);
  return records;
}

function numberEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
