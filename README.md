# SkillCheck

SkillCheck is a static directory of agent skills. It lists metadata, a compatibility reading for Hermes, OpenClaw, Claude Code, and Codex, GitHub activity, and static scan flags. It links to the source. It does not host or mirror skill files.

## What is stored

`data/skills.json` holds derived fields: id, name, description, source URL, repo, path, author, tags, frontmatter keys, compatibility labels and reasons, GitHub fields, scan flags, and a content hash. The hash is how a later run can tell a file changed. The SKILL.md text and script text are not written to disk.

`data/cache/github.json` stores GitHub ETags, repo metadata, and file paths with blob SHAs. It does not store file text. `data/cache/analysis.json` stores the derived record for a blob SHA. A later run skips the repo request when the ETag matches, and skips the raw file when the blob SHA and rule version match.

## Ingest

```bash
npm ci
npm run ingest
```

ClawHub: `GET https://clawhub.ai/api/v1/skills` with cursor pagination, `sort=downloads`, and `nonSuspiciousOnly=true`. Docs: https://docs.openclaw.ai/clawhub/http-api. The script follows `nextCursor`, backs off on HTTP 429, and fetches each `SKILL.md` with the file preview endpoint for analysis only. `sort=updated` is also valid if you want the newest publishes instead of the most downloaded.

skills.sh: the v1 API exists and requires a Vercel OIDC token. This repo does not connect a Vercel account. `robots.txt` also disallows `/api/` and `/search`. The ingest reads the public sitemap (allowed) at about one request per second, then reads `SKILL.md` from the GitHub repo the sitemap URL points at.

The committed catalog used to stop at 36 skills because the script defaulted to 24 ClawHub rows and 12 skills.sh rows. ClawHub cursor pagination itself advances. The skills.sh sitemap is readable. Those caps, not a broken source, were the limit. An older nightly wrote `data/` on `bot/nightly-ingest` and left `main` at 36.

Limits for a full run, applied after the quality filters:

- `INGEST_CLAWHUB_MAX` (default 520): highest ClawHub download counts, keeping only skills with at least 1,000 downloads and a description plus a body of at least 80 characters
- `INGEST_SKILLSSH_MAX` (default 200): after a larger sitemap pool (`INGEST_SKILLSSH_POOL`, default 20 times the max, at least 2,500), keep the highest GitHub star counts among repos with at least 10 stars, not archived, and pushed within 18 months (540 days)

The home page sorts by `qualityScore`. See the about page for the formula: log popularity scaled inside each source (70), recency (20 or 12), a clear description (10), minus 15 per scan flag (up to 40).

Set either value to `0` to skip that source. The nightly workflow uses 800 and 200. If a run returns fewer skills than a catalog that already has 500, the script leaves `data/skills.json` unchanged.

`GITHUB_TOKEN` is optional locally. GitHub Actions sets it on the nightly job. With it, enrichment can read more repos before the rate limit. Stars and last push come from the GitHub repo API. A ClawHub listing with no GitHub repo stays unenriched. The script stops skills.sh enrichment when the rate limit is spent and keeps the skills already read.

GitHub fields are stars, last push, open issues and pull requests (GitHub's `open_issues_count` includes pull requests), license, and archived. Health:

- **Active**: not archived, and the last push was within 365 days
- **Quiet**: not archived, and the last push is older than 365 days
- **Archived**: the repo is archived
- **Unknown**: no GitHub repo was recorded

Dedupe key: normalized GitHub repo URL plus the `SKILL.md` path. A ClawHub listing with no repo stays separate and is keyed by its ClawHub URL.

## Compatibility

Rules live in `rules/*.yaml`. Each file has a version and a link to the spec it was checked against. See `rules/README.md`. Labels are compatible, likely, and needs changes. The reason is part of the result.

## Scan

The scan reads SKILL.md and, when the GitHub tree lists them, small script files next to that skill. It flags a pipe into a shell, a base64 blob, a credential or keychain path, and an obfuscated URL. The site says "scanned, no flags" or lists the flags. It does not say a skill is safe.

## Develop

```bash
npm test
npm run dev
npm run build
npm run preview
```

`npm test` does not call the network. `npm run build` checks the sitemap, copies `sitemap-index.xml` to `sitemap.xml`, then runs Pagefind.

## Sitemap

GitHub Pages builds set `SITE=https://mystickcal.github.io` and `BASE_PATH=/skillcheck`. Astro writes `sitemap-index.xml` and `sitemap-0.xml` with absolute `https://mystickcal.github.io/skillcheck/` URLs. The build copies the index to `sitemap.xml`, so both `/sitemap-index.xml` and `/sitemap.xml` are the same sitemap index. GitHub Pages already serves those `.xml` files as `application/xml`. `public/_headers` sets that type for Cloudflare Pages.

`https://mystickcal.github.io/robots.txt` is not this repository. A project site cannot replace the host root robots file. Search Console still reads robots.txt from the host root, and that file is outside SkillCheck.

Search on the built site uses Pagefind. Filters for agent, reading, category, health, and scan run in the browser on the static table.

Pageview analytics is off unless you set an env var. GitHub Pages does not count pageviews on its own, and every hosted counter needs an account. Nothing is loaded when the vars are unset.

- `PUBLIC_CF_BEACON_TOKEN`: Cloudflare Web Analytics. Needs a free Cloudflare account. Create a site and copy the beacon token.
- `PUBLIC_GOATCOUNTER_SRC`: GoatCounter, for example `https://skillcheck.goatcounter.com/count`. Needs a free GoatCounter account. No cookies.
- `PUBLIC_PLAUSIBLE_DOMAIN`: Plausible. Needs a Plausible account (their hosted product is paid) or a self-hosted Plausible. Optional `PUBLIC_PLAUSIBLE_SCRIPT` overrides `https://plausible.io/js/script.js`.

No analytics account is connected in this repo.

## Deploy

No hosting account is connected. Do not add a custom domain.

### GitHub Pages (preview)

Workflows:

- `.github/workflows/ci.yml` runs tests and a build on pull requests.
- `.github/workflows/pages.yml` builds `main` and deploys with `actions/deploy-pages`. The job uses the default `GITHUB_TOKEN` only.
- `.github/workflows/nightly.yml` runs on a schedule from `main`. It ingests, commits `data/` straight to `main`, builds, and deploys that build with `actions/deploy-pages`. The ingest script refuses to replace a catalog of 500 or more with a smaller file, so a short run does not get committed or deployed. The workflow only pushes when it is running on `main`. A `GITHUB_TOKEN` push does not start other workflows, so this nightly job deploys the site itself instead of waiting for the Pages workflow. Both workflows share the `pages` concurrency group so two deploys do not run at once.

After merge, set the repository Pages source to GitHub Actions. The project site base path is `/skillcheck`. The workflows set `BASE_PATH=/skillcheck` and `SITE=https://mystickcal.github.io`. The live site is `https://mystickcal.github.io/skillcheck/`.

### Cloudflare Pages later

Connect the GitHub repo in Cloudflare when you are ready. Use the Astro preset, build command `npm run build`, and output directory `dist`. Leave `BASE_PATH` unset so the site is served from `/`. Leave the custom domain empty. You can set one of the analytics env vars there if you want pageview counts.

### Vercel later

Import the repo. Vercel detects Astro. Leave `BASE_PATH` unset. Do not add a custom domain. The skills.sh v1 API can use a Vercel OIDC token later. This project does not request one.

## Claim and updates

Each skill page links to a GitHub issue template for a maintainer claim.

SkillCheck Weekly signup is off unless `PUBLIC_NEWSLETTER_ENABLED=true`. The GitHub Pages workflows set that flag. The form posts JSON to `PUBLIC_NEWSLETTER_GATEWAY` (default `https://newsletter.clickconsultants.com`) at `/v1/subscriptions` with `brand: "skillcheck"`, `consent: true`, and an empty `company` honeypot. A 2xx response says "Check your inbox to confirm". Any other response is a generic error. The page never says the address is subscribed. Without JavaScript, the page links to the hosted form at `https://newsletter.clickconsultants.com/subscription/form`.

Set `PUBLIC_NEWSLETTER_TURNSTILE_SITE_KEY` only if this brand starts requiring a Turnstile token. No other third-party script is loaded.

The gateway currently allows the origin `https://mystickcal.github.io`. Leave the flag off for a Cloudflare Pages or Vercel origin until that origin is allowed too.
