import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";

const site = process.env.SITE || "https://mystickcal.github.io";
const base = process.env.BASE_PATH || "/";

export default defineConfig({
  site,
  base,
  trailingSlash: "always",
  integrations: [sitemap()],
  build: {
    format: "directory",
  },
});
