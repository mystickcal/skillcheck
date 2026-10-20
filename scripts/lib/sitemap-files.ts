import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SITEMAP_NS = "http://www.sitemaps.org/schemas/sitemap/0.9";

export function sitemapPrefix(site: string, base: string): string {
  const origin = site.replace(/\/+$/, "");
  const path = base === "/" || base === "" ? "/" : base.endsWith("/") ? base : `${base}/`;
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

export function sitemapLocs(xml: string): string[] {
  if (!xml.startsWith("<?xml")) throw new Error("Sitemap is missing an XML declaration.");
  if (!xml.includes(`xmlns="${SITEMAP_NS}"`)) throw new Error("Sitemap is missing the sitemap.org namespace.");
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].trim());
  if (locs.length === 0) throw new Error("Sitemap has no loc entries.");
  return locs;
}

export function assertUnderPrefix(locs: string[], prefix: string): void {
  for (const loc of locs) {
    let url: URL;
    try {
      url = new URL(loc);
    } catch {
      throw new Error(`Sitemap loc is not an absolute URL: ${loc}`);
    }
    if (url.protocol !== "https:") throw new Error(`Sitemap loc is not https: ${loc}`);
    if (!loc.startsWith(prefix)) throw new Error(`Sitemap loc is outside ${prefix}: ${loc}`);
  }
}

export function publishSitemapAlias(distDir: string, site: string, base: string): void {
  const prefix = sitemapPrefix(site, base);
  const indexPath = join(distDir, "sitemap-index.xml");
  const index = readFileSync(indexPath, "utf8");
  const childLocs = sitemapLocs(index);
  assertUnderPrefix(childLocs, prefix);
  for (const loc of childLocs) {
    const name = new URL(loc).pathname.split("/").filter(Boolean).pop();
    if (!name || !name.endsWith(".xml")) throw new Error(`Sitemap index loc is not an xml file: ${loc}`);
    const childPath = join(distDir, name);
    if (!existsSync(childPath)) throw new Error(`Sitemap index points at missing file ${name}`);
    assertUnderPrefix(sitemapLocs(readFileSync(childPath, "utf8")), prefix);
  }
  writeFileSync(join(distDir, "sitemap.xml"), index);
}
