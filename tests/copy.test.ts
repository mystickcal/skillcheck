import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOTS = ["src", "rules", "scripts", ".github"];
const FILES = ["README.md"];

function walk(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) walk(path, found);
    else if (/\.(astro|ts|css|md|yml|yaml|mjs|svg)$/.test(entry)) found.push(path);
  }
  return found;
}

describe("copy", () => {
  it("keeps em dashes out of project copy", () => {
    const files = [...FILES, ...ROOTS.flatMap((root) => walk(root))];
    const hits: string[] = [];
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      if (text.includes("—") || text.includes("–")) hits.push(file);
    }
    expect(hits).toEqual([]);
  });
});
