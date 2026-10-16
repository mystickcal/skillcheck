import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { SkillRecord } from "./types.js";

type Entry = { sha: string; rulesVersion: string; record: SkillRecord };
type CacheFile = { files: Record<string, Entry> };

const CACHE_PATH = "data/cache/analysis.json";

export function loadAnalysisCache(): CacheFile {
  if (!existsSync(CACHE_PATH)) return { files: {} };
  return JSON.parse(readFileSync(CACHE_PATH, "utf8")) as CacheFile;
}

export function saveAnalysisCache(cache: CacheFile): void {
  mkdirSync(dirname(CACHE_PATH), { recursive: true });
  writeFileSync(CACHE_PATH, `${JSON.stringify(cache, null, 2)}\n`);
}

export function cachedRecord(cache: CacheFile, key: string, sha: string, rulesVersion: string): SkillRecord | null {
  const entry = cache.files[key];
  if (!entry || entry.sha !== sha || entry.rulesVersion !== rulesVersion) return null;
  return entry.record;
}

export function storeRecord(cache: CacheFile, key: string, sha: string, rulesVersion: string, record: SkillRecord): void {
  cache.files[key] = { sha, rulesVersion, record };
}
