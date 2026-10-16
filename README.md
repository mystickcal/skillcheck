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

Limits for a local run:

- `INGEST_CLAWHUB_MAX` (default 24)
- `INGEST_SKILLSSH_MAX` (default 12)

Set either value to `0` to skip that source. The nightly workflow uses 80 and 40.

`GITHUB_TOKEN` is optional. With it, GitHub enrichment can read more repos before the rate limit. Without it, the script uses the public rate limit.

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

`npm test` does not call the network. `npm run build` runs Pagefind after the Astro build.

Search on the built site uses Pagefind. Filters for agent, reading, category, health, and scan run in the browser on the static table.

Cloudflare Web Analytics is off unless `PUBLIC_CF_BEACON_TOKEN` is set. No token is set in this repo.

## Deploy

No hosting account is connected. Do not add a custom domain.

### GitHub Pages (preview)

Workflows:

- `.github/workflows/ci.yml` runs tests and a build on pull requests.
- `.github/workflows/pages.yml` builds `main` and deploys with `actions/deploy-pages`. The job uses the default `GITHUB_TOKEN` only.
- `.github/workflows/nightly.yml` runs ingest, commits `data/` on `bot/nightly-ingest`, builds, and deploys that snapshot to GitHub Pages.

After merge, set the repository Pages source to GitHub Actions. The project site base path is `/skillcheck`. The workflows set `BASE_PATH=/skillcheck` and `SITE=https://mystickcal.github.io`.

The nightly branch is not merged into `main` by the workflow. Review it and merge when you want `main` to carry the new metadata.

### Cloudflare Pages later

Connect the GitHub repo in Cloudflare when you are ready. Use the Astro preset, build command `npm run build`, and output directory `dist`. Leave `BASE_PATH` unset so the site is served from `/`. Leave the custom domain empty. You can set `PUBLIC_CF_BEACON_TOKEN` there if you want the analytics snippet.

### Vercel later

Import the repo. Vercel detects Astro. Leave `BASE_PATH` unset. Do not add a custom domain. The skills.sh v1 API can use a Vercel OIDC token later. This project does not request one.

## Claim and updates

Each skill page links to a GitHub issue template for a maintainer claim. The about page has a placeholder form that opens a GitHub issue. No email is stored.
