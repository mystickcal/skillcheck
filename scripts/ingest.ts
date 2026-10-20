import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { cachedRecord, loadAnalysisCache, saveAnalysisCache, storeRecord } from "./lib/analysis-cache.js";
import { listClawhub, fetchClawhubSkill, clawhubPageUrl } from "./lib/clawhub.js";
import { loadRules } from "./lib/compat.js";
import {
  GithubRateLimitError,
  fetchRaw,
  githubShouldStop,
  loadGithubCache,
  loadRepo,
  matchSkillPath,
  saveGithubCache,
  scriptPaths,
} from "./lib/github.js";
import { healthFor } from "./lib/health.js";
import { DEFAULT_CLAWHUB_MAX, DEFAULT_SKILLSSH_MAX, numberEnv } from "./lib/limits.js";
import { clawhubKept, isStubMarkdown, scoreSkills, skillsShKept, sortByQuality } from "./lib/quality.js";
import { analyzeSkill, dedupeSkills, makeId } from "./lib/record.js";
import { listSkillsSh } from "./lib/skillssh.js";
import type { SkillRecord } from "./lib/types.js";

const clawhubMax = numberEnv("INGEST_CLAWHUB_MAX", DEFAULT_CLAWHUB_MAX);
const skillsShMax = numberEnv("INGEST_SKILLSSH_MAX", DEFAULT_SKILLSSH_MAX);

async function main(): Promise<void> {
  const records: SkillRecord[] = [];
  const cache = loadGithubCache();
  const analysis = loadAnalysisCache();
  const rulesVersion = loadRules().map((rule) => `${rule.agent}@${rule.version}`).join(",");
  records.push(...(await ingestClawhub()));
  records.push(...(await ingestSkillsSh(cache, analysis, rulesVersion)));
  saveGithubCache(cache);
  saveAnalysisCache(analysis);
  const skills = sortByQuality(scoreSkills(dedupeSkills(records)));
  if (skills.length === 0) throw new Error("Ingest produced no skills. Existing data was left untouched.");
  const previousCount = existingCount();
  if (previousCount >= 500 && skills.length < previousCount) {
    throw new Error(
      `Ingest produced ${skills.length} skills, fewer than the ${previousCount} already stored. Left the file unchanged.`,
    );
  }
  mkdirSync("data", { recursive: true });
  writeFileSync("data/skills.json", `${JSON.stringify(skills, null, 2)}\n`);
  const clawhubCount = skills.filter((skill) => skill.sources.some((source) => source.name === "clawhub")).length;
  const skillsShCount = skills.filter((skill) => skill.sources.some((source) => source.name === "skills.sh")).length;
  console.log(`Wrote ${skills.length} skills to data/skills.json (clawhub ${clawhubCount}, skills.sh ${skillsShCount})`);
}

async function ingestClawhub(): Promise<SkillRecord[]> {
  if (clawhubMax <= 0) return [];
  const items = await listClawhub(clawhubMax + 250);
  const records = (
    await mapPool(items, 6, async (item) => {
      const pageUrl = clawhubPageUrl(item);
      if (!pageUrl || !item.slug) return null;
      if (!clawhubKept(item.stats?.downloads ?? 0)) return null;
      const text = await fetchClawhubSkill(item);
      if (!text || !text.includes("---") || isStubMarkdown(text)) return null;
      return analyzeSkill({
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
        updatedAt: typeof item.updatedAt === "number" ? new Date(item.updatedAt).toISOString() : null,
      });
    })
  ).slice(0, clawhubMax);
  console.log(`ClawHub progress: ${records.length}`);
  console.log(`ClawHub skills analyzed: ${records.length}`);
  return records;
}

async function ingestSkillsSh(
  cache: ReturnType<typeof loadGithubCache>,
  analysis: ReturnType<typeof loadAnalysisCache>,
  rulesVersion: string,
): Promise<SkillRecord[]> {
  if (skillsShMax <= 0) return [];
  const poolSize = numberEnv("INGEST_SKILLSSH_POOL", Math.max(skillsShMax * 20, 2500));
  const listings = await listSkillsSh(poolSize);
  const records: SkillRecord[] = [];
  const byRepo = new Map<string, typeof listings>();
  for (const listing of listings) {
    const group = byRepo.get(listing.repoUrl) ?? [];
    group.push(listing);
    byRepo.set(listing.repoUrl, group);
  }
  const ranked: Array<{ repoUrl: string; group: typeof listings; stars: number }> = [];
  for (const [repoUrl, group] of byRepo) {
    if (githubShouldStop()) break;
    try {
      const preview = await loadRepo(repoUrl, cache, process.env.GITHUB_TOKEN, { tree: false });
      if (!preview || !skillsShKept(preview.info)) continue;
      ranked.push({ repoUrl, group, stars: preview.info.stars });
    } catch (error) {
      if (error instanceof GithubRateLimitError || githubShouldStop()) {
        console.warn(`Stopped skills.sh repo scan: ${(error as Error).message}`);
        break;
      }
      console.warn(`Skipped ${repoUrl}: ${(error as Error).message}`);
    }
  }
  ranked.sort((a, b) => b.stars - a.stars || a.repoUrl.localeCompare(b.repoUrl));
  console.log(`skills.sh repos above the star and recency bar: ${ranked.length}`);
  for (const { repoUrl, group } of ranked) {
    if (records.length >= skillsShMax || githubShouldStop()) break;
    let repo: Awaited<ReturnType<typeof loadRepo>>;
    try {
      repo = await loadRepo(repoUrl, cache);
    } catch (error) {
      if (error instanceof GithubRateLimitError || githubShouldStop()) {
        console.warn(`Stopped skills.sh enrichment: ${(error as Error).message}`);
        break;
      }
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
        records.push({
          ...previous,
          github: repo.info,
          health: healthFor(repo.info),
          updatedAt: previous.updatedAt ?? repo.info.lastPush,
          qualityScore: 0,
        });
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
    if (githubShouldStop()) break;
  }
  console.log(`skills.sh skills analyzed: ${records.length}`);
  return records;
}

async function mapPool<T, R>(items: T[], size: number, fn: (item: T) => Promise<R | null>): Promise<R[]> {
  const results: R[] = [];
  let index = 0;
  async function worker(): Promise<void> {
    while (index < items.length && results.length < clawhubMax) {
      const current = index;
      index += 1;
      const value = await fn(items[current]);
      if (value) results.push(value);
    }
  }
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, () => worker()));
  return results;
}

function existingCount(): number {
  if (!existsSync("data/skills.json")) return 0;
  const parsed = JSON.parse(readFileSync("data/skills.json", "utf8")) as unknown;
  return Array.isArray(parsed) ? parsed.length : 0;
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
