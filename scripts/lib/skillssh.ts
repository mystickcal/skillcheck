import { fetchText } from "./http.js";

const SITEMAP = "https://www.skills.sh/sitemap.xml";

export type SkillsShListing = {
  pageUrl: string;
  owner: string;
  repo: string;
  slug: string;
  repoUrl: string;
};

export async function listSkillsSh(maxItems: number): Promise<SkillsShListing[]> {
  const index = await fetchText(SITEMAP, { minDelayMs: 1000 });
  if (index.status !== 200) throw new Error(`skills.sh sitemap returned ${index.status}`);
  const maps = locs(index.text).filter((url) => url.includes("sitemap-skills"));
  const listings: SkillsShListing[] = [];
  for (const mapUrl of maps) {
    if (listings.length >= maxItems) break;
    const site = await fetchText(mapUrl, { minDelayMs: 1000 });
    if (site.status !== 200) continue;
    for (const pageUrl of locs(site.text)) {
      const parsed = parseSkillUrl(pageUrl);
      if (!parsed) continue;
      listings.push(parsed);
      if (listings.length >= maxItems) break;
    }
  }
  return listings;
}

export function parseSkillUrl(pageUrl: string): SkillsShListing | null {
  let url: URL;
  try {
    url = new URL(pageUrl);
  } catch {
    return null;
  }
  if (!url.hostname.endsWith("skills.sh")) return null;
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length !== 3) return null;
  const [owner, repo, slug] = parts;
  return {
    pageUrl: `https://www.skills.sh/${owner}/${repo}/${slug}`,
    owner,
    repo,
    slug,
    repoUrl: `https://github.com/${owner}/${repo}`,
  };
}

export function locs(xml: string): string[] {
  return [...xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/g)].map((match) => match[1].trim());
}
