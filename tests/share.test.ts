import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { renderSharePng, shareCardSvg } from "../scripts/og-image.js";
import { catalogSkillCount, shareImageDescription, shareImageUrl } from "../src/lib/share.js";

function walk(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) walk(path, found);
    else found.push(path);
  }
  return found;
}

function pngSize(png: Buffer): { width: number; height: number } {
  expect(png.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  expect(png.toString("ascii", 12, 16)).toBe("IHDR");
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
}

describe("share image", () => {
  it("builds an absolute image URL on the project base path", () => {
    expect(shareImageUrl("https://mystickcal.github.io", "/skillcheck")).toBe(
      "https://mystickcal.github.io/skillcheck/og.png",
    );
    expect(shareImageUrl("https://mystickcal.github.io/", "/skillcheck/")).toBe(
      "https://mystickcal.github.io/skillcheck/og.png",
    );
    expect(shareImageUrl(new URL("https://mystickcal.github.io"), "/")).toBe("https://mystickcal.github.io/og.png");
  });

  it("reads a skill count only from a catalog array", () => {
    expect(catalogSkillCount([{ id: "a" }, { id: "b" }])).toBe(2);
    expect(catalogSkillCount({ skills: [] })).toBeNull();
    expect(catalogSkillCount(null)).toBeNull();
  });

  it("puts the description and the build-time count on the card", () => {
    const svg = shareCardSvg(720);
    expect(svg).toContain(shareImageDescription);
    expect(svg).toContain(">720 skills<");
    expect(shareCardSvg(1)).toContain(">1 skill<");
    expect(shareCardSvg(null)).not.toContain("skills</text>");
  });

  it("renders a 1200 by 630 PNG", () => {
    const png = renderSharePng(720);
    expect(pngSize(png)).toEqual({ width: 1200, height: 630 });
    expect(png.length).toBeGreaterThan(20_000);
  });

  it("adds the large-card tags on the shared layout", () => {
    const layout = readFileSync("src/layouts/Base.astro", "utf8");
    for (const snippet of [
      'property="og:title"',
      'property="og:description"',
      'property="og:image"',
      'property="og:url"',
      'property="og:type"',
      'name="twitter:card"',
      'content="summary_large_image"',
      'name="twitter:image"',
      'name="twitter:title"',
      'name="twitter:description"',
      "shareImageUrl",
    ]) {
      expect(layout).toContain(snippet);
    }
    const pages = walk("src/pages").filter((path) => path.endsWith(".astro"));
    expect(pages.length).toBeGreaterThan(0);
    for (const page of pages) expect(readFileSync(page, "utf8")).toContain("layouts/Base.astro");
  });
});
