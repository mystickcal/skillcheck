export const shareImageDescription =
  "See which agent skills work in Claude Code, Codex, OpenClaw and Hermes";

export function shareImageUrl(site: URL | string, base: string): string {
  const prefix = base.endsWith("/") ? base : `${base}/`;
  const origin = typeof site === "string" ? site : site.href;
  return new URL("og.png", new URL(prefix, origin)).href;
}

export function catalogSkillCount(data: unknown): number | null {
  return Array.isArray(data) ? data.length : null;
}
