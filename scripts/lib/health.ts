import type { GithubInfo, Health } from "./types.js";

const YEAR_MS = 365 * 24 * 60 * 60 * 1000;

export function healthFor(github: GithubInfo | null, now = Date.now()): Health {
  if (!github) return "unknown";
  if (github.archived) return "archived";
  if (!github.lastPush) return "unknown";
  const pushed = Date.parse(github.lastPush);
  if (Number.isNaN(pushed)) return "unknown";
  if (now - pushed > YEAR_MS) return "quiet";
  return "active";
}
