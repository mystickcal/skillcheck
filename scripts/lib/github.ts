import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname } from "node:path";
import { fetchJson, fetchText } from "./http.js";
import type { GithubInfo } from "./types.js";

export type TreeFile = { path: string; sha: string; type: string };

type RepoCache = {
  etag?: string;
  info: GithubInfo;
  files: TreeFile[];
  fetchedAt: string;
};

type CacheFile = { repos: Record<string, RepoCache> };

const CACHE_PATH = "data/cache/github.json";

export function loadGithubCache(): CacheFile {
  if (!existsSync(CACHE_PATH)) return { repos: {} };
  return JSON.parse(readFileSync(CACHE_PATH, "utf8")) as CacheFile;
}

export function saveGithubCache(cache: CacheFile): void {
  mkdirSync(dirname(CACHE_PATH), { recursive: true });
  writeFileSync(CACHE_PATH, `${JSON.stringify(cache, null, 2)}\n`);
}

export async function loadRepo(
  repoUrl: string,
  cache: CacheFile,
  token = process.env.GITHUB_TOKEN,
): Promise<RepoCache | null> {
  const slug = repoSlug(repoUrl);
  if (!slug) return null;
  const cached = cache.repos[repoUrl];
  const headers: Record<string, string> = {
    accept: "application/vnd.github+json",
    "x-github-api-version": "2022-11-28",
  };
  if (token) headers.authorization = `Bearer ${token}`;
  if (cached?.etag) headers["if-none-match"] = cached.etag;

  const repoResponse = await fetchText(`https://api.github.com/repos/${slug}`, {
    headers,
    minDelayMs: 400,
  });
  if (repoResponse.status === 304 && cached) return cached;
  if (repoResponse.status === 404) return null;
  if (repoResponse.status !== 200) {
    throw new Error(`GitHub repo ${slug} returned ${repoResponse.status}`);
  }
  const repo = JSON.parse(repoResponse.text) as {
    stargazers_count?: number;
    pushed_at?: string | null;
    open_issues_count?: number;
    archived?: boolean;
    license?: { spdx_id?: string | null } | null;
    default_branch?: string;
  };
  const info: GithubInfo = {
    stars: repo.stargazers_count ?? 0,
    lastPush: repo.pushed_at ?? null,
    openIssuesAndPullRequests: repo.open_issues_count ?? 0,
    license: repo.license?.spdx_id && repo.license.spdx_id !== "NOASSERTION" ? repo.license.spdx_id : null,
    archived: Boolean(repo.archived),
  };
  const branch = repo.default_branch || "HEAD";
  const treeHeaders = { ...headers };
  delete treeHeaders["if-none-match"];
  const tree = await fetchJson<{ tree?: TreeFile[]; truncated?: boolean }>(
    `https://api.github.com/repos/${slug}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
    { headers: treeHeaders, minDelayMs: 400 },
  );
  const files = (tree.data.tree ?? []).filter((file) => file.type === "blob");
  const entry: RepoCache = {
    etag: repoResponse.headers.get("etag") ?? undefined,
    info,
    files,
    fetchedAt: new Date().toISOString(),
  };
  cache.repos[repoUrl] = entry;
  return entry;
}

export function matchSkillPath(files: TreeFile[], slug: string): string | null {
  const skillFiles = files.map((file) => file.path).filter((path) => path.endsWith("/SKILL.md") || path === "SKILL.md");
  const needle = `/${slug.toLowerCase()}/skill.md`;
  const exact = skillFiles.find((path) => path.toLowerCase().endsWith(needle) || path.toLowerCase() === `${slug.toLowerCase()}/skill.md`);
  if (exact) return exact;
  if (skillFiles.length === 1) return skillFiles[0];
  return null;
}

export async function fetchRaw(repoUrl: string, path: string): Promise<string | null> {
  const slug = repoSlug(repoUrl);
  if (!slug) return null;
  const url = `https://raw.githubusercontent.com/${slug}/HEAD/${path}`;
  const response = await fetchText(url, { minDelayMs: 400 });
  if (response.status !== 200) return null;
  return response.text;
}

export function repoSlug(repoUrl: string): string | null {
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)$/i);
  if (!match) return null;
  return `${match[1]}/${match[2].replace(/\.git$/, "")}`;
}

export function scriptPaths(files: TreeFile[], skillPath: string): string[] {
  const dir = skillPath.split("/").slice(0, -1).join("/");
  const prefix = dir ? `${dir}/scripts/` : "scripts/";
  return files
    .map((file) => file.path)
    .filter((path) => path.startsWith(prefix) && /\.(sh|py|js|mjs|ts|bash)$/i.test(path))
    .slice(0, 8);
}
