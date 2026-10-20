import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { publishSitemapAlias, sitemapPrefix } from "../scripts/lib/sitemap-files.js";

const prefix = "https://mystickcal.github.io/skillcheck/";

describe("sitemap files", () => {
  it("builds the GitHub Pages prefix from site and base", () => {
    expect(sitemapPrefix("https://mystickcal.github.io", "/skillcheck")).toBe(prefix);
    expect(sitemapPrefix("https://mystickcal.github.io/", "/skillcheck/")).toBe(prefix);
  });

  it("writes sitemap.xml and rejects a loc outside the project path", () => {
    const dir = mkdtempSync(join(tmpdir(), "skillcheck-sitemap-"));
    const child = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${prefix}</loc></url><url><loc>${prefix}about/</loc></url></urlset>`;
    const index = `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>${prefix}sitemap-0.xml</loc></sitemap></sitemapindex>`;
    writeFileSync(join(dir, "sitemap-0.xml"), child);
    writeFileSync(join(dir, "sitemap-index.xml"), index);
    publishSitemapAlias(dir, "https://mystickcal.github.io", "/skillcheck");
    expect(readFileSync(join(dir, "sitemap.xml"), "utf8")).toBe(index);

    writeFileSync(
      join(dir, "sitemap-0.xml"),
      child.replace(`${prefix}about/`, "https://mystickcal.github.io/about/"),
    );
    expect(() => publishSitemapAlias(dir, "https://mystickcal.github.io", "/skillcheck")).toThrow(/outside/);
  });
});
