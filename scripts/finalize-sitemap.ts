import { publishSitemapAlias } from "./lib/sitemap-files.js";

const site = process.env.SITE || "https://mystickcal.github.io";
const base = process.env.BASE_PATH || "/";
publishSitemapAlias("dist", site, base);
console.log(`Wrote dist/sitemap.xml as a copy of sitemap-index.xml under ${site} base ${base}`);
