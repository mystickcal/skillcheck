import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Resvg } from "@resvg/resvg-js";
import { catalogSkillCount, shareImageByline, shareImageDescription } from "../src/lib/share.js";
import { woffToSfnt } from "./lib/woff.js";

const WIDTH = 1200;
const HEIGHT = 630;
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);

const libreWoff = require.resolve("@fontsource/libre-baskerville/files/libre-baskerville-latin-400-normal.woff");
const sansWoff = require.resolve("@fontsource/source-sans-3/files/source-sans-3-latin-400-normal.woff");

function xml(text: string): string {
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function countLabel(skillCount: number): string {
  const formatted = new Intl.NumberFormat("en-US").format(skillCount);
  return `${formatted} ${skillCount === 1 ? "skill" : "skills"}`;
}

export function shareCardSvg(skillCount: number | null): string {
  const count =
    skillCount === null
      ? ""
      : `<line x1="80" y1="426" x2="280" y2="426" stroke="#ddd4c3" stroke-width="2"/>
  <text x="80" y="476" font-family="Source Sans 3" font-size="28" fill="#0f5f5b">${xml(countLabel(skillCount))}</text>`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="#f4f0e6"/>
  <rect width="12" height="${HEIGHT}" fill="#0f5f5b"/>
  <rect x="80" y="154" width="48" height="48" rx="10" fill="#0f5f5b"/>
  <path d="M92 178.2 101.4 188.2 116.5 170" fill="none" stroke="#f4f0e6" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="80" y="304" font-family="Libre Baskerville" font-size="84" fill="#1c1915" letter-spacing="-2">SkillCheck</text>
  <text x="80" y="374" font-family="Source Sans 3" font-size="30" fill="#5f584e">${xml(shareImageDescription)}</text>
  ${count}
  <text x="1120" y="476" text-anchor="end" font-family="Source Sans 3" font-size="26" fill="#5f584e">${xml(shareImageByline)}</text>
</svg>`;
}

export function renderSharePng(skillCount: number | null): Buffer {
  const dir = mkdtempSync(join(tmpdir(), "skillcheck-og-"));
  const libre = join(dir, "libre.ttf");
  const sans = join(dir, "sans.ttf");
  writeFileSync(libre, woffToSfnt(readFileSync(libreWoff)));
  writeFileSync(sans, woffToSfnt(readFileSync(sansWoff)));
  try {
    const resvg = new Resvg(shareCardSvg(skillCount), {
      fitTo: { mode: "width", value: WIDTH },
      textRendering: 2,
      font: {
        fontFiles: [libre, sans],
        loadSystemFonts: false,
        serifFamily: "Libre Baskerville",
        sansSerifFamily: "Source Sans 3",
      },
    });
    const rendered = resvg.render();
    if (rendered.width !== WIDTH || rendered.height !== HEIGHT) {
      throw new Error(`Share image is ${rendered.width}x${rendered.height}, expected ${WIDTH}x${HEIGHT}.`);
    }
    return rendered.asPng();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function isDirectRun(): boolean {
  const entry = process.argv[1];
  if (!entry) return false;
  return import.meta.url === pathToFileURL(entry).href;
}

if (isDirectRun()) {
  const data: unknown = JSON.parse(readFileSync(join(root, "data/skills.json"), "utf8"));
  const count = catalogSkillCount(data);
  const out = join(root, "public/og.png");
  writeFileSync(out, renderSharePng(count));
  console.log(`Wrote ${out}${count === null ? "" : ` (${countLabel(count)})`}`);
}
