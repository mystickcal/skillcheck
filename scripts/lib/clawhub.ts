import { fetchJson, fetchText } from "./http.js";

export type ClawhubItem = {
  ownerHandle?: string;
  slug?: string;
  displayName?: string;
  summary?: string;
  topics?: string[];
  stats?: { downloads?: number; stars?: number };
};

type ClawhubPage = { items?: ClawhubItem[]; nextCursor?: string | null };

export async function listClawhub(maxItems: number): Promise<ClawhubItem[]> {
  const items: ClawhubItem[] = [];
  let cursor: string | null = null;
  while (items.length < maxItems) {
    const params = new URLSearchParams({
      limit: "50",
      sort: "downloads",
      nonSuspiciousOnly: "true",
    });
    if (cursor) params.set("cursor", cursor);
    const page = await fetchJson<ClawhubPage>(`https://clawhub.ai/api/v1/skills?${params}`, {
      minDelayMs: 80,
    });
    const batch = page.data.items ?? [];
    items.push(...batch);
    if (!page.data.nextCursor || batch.length === 0) break;
    cursor = page.data.nextCursor;
  }
  return items.slice(0, maxItems);
}

export async function fetchClawhubSkill(item: ClawhubItem): Promise<string | null> {
  if (!item.slug) return null;
  const params = new URLSearchParams({ path: "SKILL.md", preview: "1" });
  if (item.ownerHandle) params.set("ownerHandle", item.ownerHandle);
  const response = await fetchText(`https://clawhub.ai/api/v1/skills/${encodeURIComponent(item.slug)}/file?${params}`, {
    minDelayMs: 40,
  });
  if (response.status !== 200) return null;
  return response.text;
}

export function clawhubPageUrl(item: ClawhubItem): string | null {
  if (!item.ownerHandle || !item.slug) return null;
  return `https://clawhub.ai/${item.ownerHandle}/skills/${item.slug}`;
}
