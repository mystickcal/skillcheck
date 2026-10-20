import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname } from "node:path";
import { fetchText } from "./http.js";
import type { GithubInfo } from "./types.js";

export type TreeFile = { path: string; sha: string; type: string };

type RepoCache = {
  etag?: string;
  info: GithubInfo;
  files: TreeFile[];
  defaultBranch?: string;
  treeLoaded?: boolean;
  fetchedAt: string;
};

type CacheFile = { repos: Record<string, RepoCache> };

const CACHE_PATH = "data/cache/github.json";

let paused = false;

export class GithubRateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GithubRateLimitError";
  }
}

export function githubShouldStop(): boolean {
  return paused;
}

export function rateLimitHit(status: number, body: string, remaining: string | null): boolean {
  if (status === 429) return true;
  if (status === 403 && /rate limit/i.test(body)) return true;
  if (remaining === "0") return true;
  return false;
}

function noteBudget(status: number, body: string, remaining: string | null): void {
  if (rateLimitHit(status, body, remaining)) paused = true;
}

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
  options: { tree?: boolean } = {},
): Promise<RepoCache | null> {
  const slug = repoSlug(repoUrl);
  if (!slug) return null;
  if (paused) throw new GithubRateLimitError("GitHub rate limit already reached");
  const cached = cache.repos[repoUrl];
  const headers: Record<string, string> = {
    accept: "application/vnd.github+json",
    "x-github-api-version": "2022-11-28",
  };
  if (token) headers.authorization = `Bearer ${token}`;
  if (cached?.etag) headers["if-none-match"] = cached.etag;

  const repoResponse = await fetchText(`https://api.github.com/repos/${slug}`, {
    headers,
    minDelayMs: 250,
  });
  noteBudget(repoResponse.status, repoResponse.text, repoResponse.headers.get("x-ratelimit-remaining"));
  if (repoResponse.status === 429 || (repoResponse.status === 403 && /rate limit/i.test(repoResponse.text))) {
    throw new GithubRateLimitError(`GitHub rate limit while reading ${slug}`);
  }
  const wantTree = options.tree !== false;
  if (repoResponse.status === 304 && cached && (!wantTree || cached.treeLoaded !== false)) return cached;
  if (repoResponse.status === 304 && cached && wantTree) {
    const withTree = await fetchTree(slug, cached.defaultBranch || "HEAD", headers);
    const entry: RepoCache = { ...cached, files: withTree, treeLoaded: true, fetchedAt: new Date().toISOString() };
    cache.repos[repoUrl] = entry;
    return entry;
  }
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
  const files = wantTree ? await fetchTree(slug, branch, headers) : (cached?.files ?? []);
  const entry: RepoCache = {
    etag: repoResponse.headers.get("etag") ?? undefined,
    info,
    files,
    defaultBranch: branch,
    treeLoaded: wantTree,
    fetchedAt: new Date().toISOString(),
  };
  cache.repos[repoUrl] = entry;
  return entry;
}

async function fetchTree(slug: string, branch: string, headers: Record<string, string>): Promise<TreeFile[]> {
  const treeHeaders = { ...headers };
  delete treeHeaders["if-none-match"];
  const treeResponse = await fetchText(
    `https://api.github.com/repos/${slug}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
    { headers: treeHeaders, minDelayMs: 250 },
  );
  noteBudget(treeResponse.status, treeResponse.text, treeResponse.headers.get("x-ratelimit-remaining"));
  if (treeResponse.status === 429 || (treeResponse.status === 403 && /rate limit/i.test(treeResponse.text))) {
    throw new GithubRateLimitError(`GitHub rate limit while listing ${slug}`);
  }
  if (treeResponse.status !== 200) {
    throw new Error(`GitHub tree ${slug} returned ${treeResponse.status}`);
  }
  const tree = JSON.parse(treeResponse.text) as { tree?: TreeFile[] };
  return (tree.tree ?? []).filter((file) => file.type === "blob");
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
  const response = await fetchText(url, { minDelayMs: 150 });
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
