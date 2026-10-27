import type { SkillRecord } from "../../scripts/lib/types.ts";
import { skills } from "./skills";

export interface BestPick {
  id: string;
  note: string;
}

export interface BestTopic {
  slug: string;
  label: string;
  title: string;
  description: string;
  intro: string;
  picks: BestPick[];
}

// Hand-picked lists. Each note restates what the skill's own description says it does.
// Picks that leave the catalog, or pick up a scan flag, drop off the page at build time.
export const bestTopics: BestTopic[] = [
  {
    slug: "code-review",
    label: "Code review",
    title: "Best agent skills for code review",
    description: "Agent skills that review a branch or pull request, structure feedback, and help you act on review comments.",
    intro:
      "These skills give an agent a method for reviewing code instead of a vague \"looks good\". Some review your diff, one handles the other side: deciding which review comments to act on.",
    picks: [
      { id: "gh-mattpocock-skills-skills-engineering-code-review", note: "Reviews changes since a commit, branch or tag against your repo's coding standards and the original spec, in two parallel sub-agents." },
      { id: "gh-obra-superpowers-skills-requesting-code-review", note: "Asks for a review when a task or major feature is done, before merging, to check the work meets the requirements." },
      { id: "gh-obra-superpowers-skills-receiving-code-review", note: "For the other side of review: verify each suggestion before implementing it, instead of agreeing by reflex." },
      { id: "claw-wpank-code-review", note: "Review patterns for security, performance, maintainability, correctness and tests, with severity levels and anti-patterns to avoid." },
      { id: "claw-briancolinger-pr-reviewer", note: "Reviews GitHub pull requests with diff analysis and linters for Go, Python and JavaScript or TypeScript. Needs an authenticated gh CLI." },
      { id: "gh-affaan-m-ecc-agents-skills-coding-standards", note: "Baseline naming, readability and immutability conventions to review against when no framework-specific skill applies." },
    ],
  },
  {
    slug: "frontend-design",
    label: "Frontend design",
    title: "Best agent skills for frontend design",
    description: "Agent skills that push AI-built interfaces past the generic look: design guidance, UI audits, and React patterns.",
    intro:
      "Agents can build a working page fast, and it usually looks like every other AI page. These skills add design direction, UX review, and frontend patterns.",
    picks: [
      { id: "claw-michaelmonetized-frontend-design-3", note: "Aims for distinctive, production-grade interfaces and says it avoids generic AI aesthetics. For components, pages and apps." },
      { id: "claw-xobi667-ui-ux-pro-max", note: "Covers layouts, UX flows, design tokens, component specs, microcopy and accessibility, and can critique or refine existing UI." },
      { id: "claw-mpociot-superdesign", note: "Frontend design guidelines for landing pages, dashboards and other interfaces." },
      { id: "claw-tommygeoco-ui-audit", note: "Audits an interface for visual hierarchy, accessibility, cognitive load and navigation, based on the book Making UX Decisions." },
      { id: "gh-affaan-m-ecc-agents-skills-frontend-patterns", note: "React and Next.js patterns for components, state and render performance." },
      { id: "claw-ivangdavila-frontend", note: "React, Next.js and Tailwind work: landing pages, dashboards, forms and components, with responsive and accessible UI in scope." },
    ],
  },
  {
    slug: "writing",
    label: "Writing",
    title: "Best agent skills for writing",
    description: "Agent skills for articles, copy and voice: write in a voice from your own samples, strip AI tells, and write UX and marketing copy.",
    intro:
      "Most AI drafts read the same. These skills either learn a voice from your real writing, remove the usual AI patterns, or focus on one kind of copy.",
    picks: [
      { id: "gh-affaan-m-ecc-agents-skills-article-writing", note: "Long-form articles, guides, tutorials and newsletters in a voice taken from examples or brand guidance you supply." },
      { id: "gh-affaan-m-ecc-agents-skills-brand-voice", note: "Builds a style profile from your real posts, essays or docs, then reuses it across content and outreach." },
      { id: "claw-biostartechnology-humanizer", note: "Finds and fixes signs of AI writing from Wikipedia's guide: promotional language, rule of three, em dash overuse and more." },
      { id: "claw-reighlan-human-writing", note: "For content headed to publication: blog posts, newsletters, site copy. Its description rules out chat, code and internal notes." },
      { id: "claw-jk-0001-copywriting", note: "Persuasive copy for landing pages, ads, sales pages and email sequences, using formulas like AIDA and PAS." },
      { id: "claw-killerapp-copywriter", note: "UX and product copy: button labels, error messages, empty states, tooltips and CTAs." },
      { id: "gh-mattpocock-skills-skills-productivity-writing-for-agents", note: "For writing documents agents read: skills, AGENTS.md and CLAUDE.md." },
    ],
  },
  {
    slug: "pdf-and-docs",
    label: "PDFs and Office docs",
    title: "Best agent skills for PDFs and Office documents",
    description: "Agent skills for PDFs, Word, Excel and PowerPoint files: extract, fill, edit, generate, and convert documents to Markdown.",
    intro:
      "Document files break easily when an agent edits them blind. These skills cover reading, editing and generating PDFs and Office files while keeping formatting intact.",
    picks: [
      { id: "claw-awspace-pdf", note: "Extracts text and tables, merges and splits PDFs, creates new ones and fills PDF forms." },
      { id: "claw-steipete-nano-pdf", note: "Edits PDFs from plain-language instructions through the nano-pdf CLI." },
      { id: "claw-ivangdavila-word-docx", note: "Creates and edits .docx files with styles, numbering, tracked changes and tables, aiming for no formatting drift on round trips." },
      { id: "claw-ivangdavila-excel-xlsx", note: "Creates and edits Excel workbooks with attention to formulas, dates, types, formatting and templates." },
      { id: "claw-ivangdavila-powerpoint-pptx", note: "Creates and edits PowerPoint decks with layouts, placeholders, notes and charts, plus a visual check." },
      { id: "claw-steipete-markdown-converter", note: "Converts PDF, Word, PowerPoint, Excel, HTML, images and more to Markdown with markitdown, so an LLM can read them." },
      { id: "claw-ivangdavila-pdf-generator", note: "Generates PDFs such as reports, invoices and contracts from Markdown, HTML, data or code." },
    ],
  },
  {
    slug: "testing",
    label: "Testing",
    title: "Best agent skills for testing",
    description: "Agent skills that make coding agents write tests first, build end-to-end suites with Playwright, and run checks on every commit.",
    intro:
      "Agents skip tests unless something makes them write them. These skills set a test-first habit, cover end-to-end suites, and add commit-time checks.",
    picks: [
      { id: "gh-obra-superpowers-skills-test-driven-development", note: "Meant to load for any feature or bug fix, before the agent writes implementation code." },
      { id: "gh-mattpocock-skills-skills-engineering-tdd", note: "Red-green-refactor test-driven development for features and bug fixes, including integration tests." },
      { id: "gh-affaan-m-ecc-agents-skills-tdd-workflow", note: "Enforces test-driven development with a coverage target of 80% or more across unit, integration and end-to-end tests." },
      { id: "gh-affaan-m-ecc-agents-skills-e2e-testing", note: "Playwright end-to-end patterns: page objects, configuration, CI artifacts and fixing flaky runs." },
      { id: "claw-wpank-e2e-testing-patterns", note: "End-to-end suites with Playwright or Cypress, focused on critical user journeys and removing flaky tests." },
      { id: "gh-mattpocock-skills-skills-misc-setup-pre-commit", note: "Sets up Husky and lint-staged so formatting, type checks and tests run before each commit." },
    ],
  },
  {
    slug: "git-and-github",
    label: "Git and GitHub",
    title: "Best agent skills for Git and GitHub",
    description: "Agent skills for Git and GitHub: the gh CLI, worktrees, safe history fixes, commit messages, and guardrails against destructive commands.",
    intro:
      "An agent with Git access can save you hours or wipe a branch. These skills cover day-to-day Git and GitHub work, plus one that blocks the dangerous commands.",
    picks: [
      { id: "claw-steipete-github", note: "Works with issues, pull requests, CI runs and the API through the gh CLI." },
      { id: "gh-obra-superpowers-skills-using-git-worktrees", note: "Gives feature work an isolated workspace, using git worktrees when native tools aren't available." },
      { id: "gh-mattpocock-skills-skills-misc-git-guardrails-claude-code", note: "Adds Claude Code hooks that block push, reset --hard, clean, branch -D and other destructive commands." },
      { id: "claw-ivangdavila-git", note: "Commits, merges, rebases and conflicts, plus recovering lost work after a bad reset or rebase." },
      { id: "claw-gitgoodordietrying-git-workflows", note: "Advanced operations: bisect, reflog recovery, cherry-picks, subtrees, submodules and monorepos." },
      { id: "claw-bastos-conventional-commits", note: "Writes commit messages in the Conventional Commits format for changelogs and semantic versioning." },
      { id: "gh-obra-superpowers-skills-finishing-a-development-branch", note: "For when the work is done and tests pass: decides how to integrate the branch." },
    ],
  },
  {
    slug: "browser-automation",
    label: "Browser automation",
    title: "Best agent skills for browser automation",
    description: "Agent skills that let an agent drive a browser: headless CLIs, Playwright, cloud browsers, and scraping JavaScript-heavy sites.",
    intro:
      "When a site has no API, the agent needs a browser. These skills range from a headless CLI built for agents to cloud browsers that keep a login between runs.",
    picks: [
      { id: "claw-matrixy-agent-browser-clawdbot", note: "A headless browser CLI for agents that uses accessibility tree snapshots and ref-based element selection." },
      { id: "claw-ivangdavila-playwright", note: "Automates and debugs browsers with Playwright: flaky tests, locators, login state, request mocking, traces and MCP browser control." },
      { id: "claw-spiceman161-playwright-mcp", note: "Navigates, clicks, fills forms, extracts data and takes screenshots through the Playwright MCP server." },
      { id: "claw-jamesfincher-browserbase", note: "Persistent Browserbase cloud browser sessions that keep a login across runs. Needs a Browserbase API key and project id." },
      { id: "claw-d4vinci-scrapling-official", note: "Scrapes with Scrapling: plain HTTP, stealth browsers, JavaScript rendering and spiders, for sites with anti-bot protection." },
      { id: "claw-waisimon-playwright-scraper-skill", note: "Playwright-based scraping with anti-bot handling." },
    ],
  },
  {
    slug: "security-review",
    label: "Security review",
    title: "Best agent skills for security review",
    description: "Agent skills for security checks in code you write and in skills you install: OWASP reviews, checklists, and skill vetting.",
    intro:
      "Two kinds of security help here. The first two review the code your agent writes. The rest look at skills before you install them, which matters because a skill can tell your agent to run anything.",
    picks: [
      { id: "gh-affaan-m-ecc-agents-skills-security-review", note: "A security checklist for auth, user input, secrets, API endpoints and payment features." },
      { id: "claw-jgarrison929-security-auditor", note: "Reviews code for the OWASP Top 10, CORS and CSP headers, secrets, SQL injection and XSS." },
      { id: "claw-spclaudehome-skill-vetter", note: "Checks a skill for red flags, permission scope and suspicious patterns before you install it." },
      { id: "claw-tokauthai-skillscan", note: "Scans skills on install or load and blocks ones it rates high or critical." },
      { id: "claw-jamesouttake-skill-guard", note: "Stages and scans a ClawHub skill before installing it, and stops on findings or an incomplete scan." },
    ],
  },
  {
    slug: "deploys",
    label: "Deploys",
    title: "Best agent skills for deploys",
    description: "Agent skills for shipping: deployment and CI/CD patterns, Docker, database migrations, Vercel, GitHub Pages and quick hosting.",
    intro:
      "Getting code live is where agents most often guess. These skills give them deployment patterns and the exact CLI commands for a few common hosts.",
    picks: [
      { id: "gh-affaan-m-ecc-kiro-skills-deployment-patterns", note: "Deployment workflows, CI/CD pipelines, health checks, rollback plans and a production readiness checklist." },
      { id: "gh-affaan-m-ecc-kiro-skills-docker-patterns", note: "Docker and Compose patterns for local development, container security, networking and volumes." },
      { id: "gh-affaan-m-ecc-kiro-skills-database-migrations", note: "Schema and data migrations with rollbacks and zero-downtime deploys on PostgreSQL, MySQL and common ORMs." },
      { id: "claw-arnarsson-docker-essentials", note: "Everyday Docker commands for containers, images and debugging." },
      { id: "claw-thesethrose-vercel", note: "A Vercel CLI reference for deployments, domains and environment variables." },
      { id: "claw-thomeksolutions-web-deploy-github", note: "Builds a single-page static site and deploys it to GitHub Pages with GitHub Actions." },
      { id: "claw-adamludwin-here-now", note: "Publishes files and static sites to a live here.now URL, with team workspaces and custom domains." },
    ],
  },
  {
    slug: "web-search",
    label: "Web search",
    title: "Best agent skills for web search",
    description: "Agent skills that give an agent live web search: Exa, Tavily, Brave, multi-provider routing, and a no-key DuckDuckGo fallback.",
    intro:
      "Agents without search answer from old training data. These skills connect a search provider, and one works with no API key at all.",
    picks: [
      { id: "gh-affaan-m-ecc-agents-skills-exa-search", note: "Exa neural search through MCP for web pages, code examples, companies and people." },
      { id: "gh-affaan-m-ecc-agents-skills-deep-research", note: "Searches with the Firecrawl and Exa MCPs and writes a cited report." },
      { id: "claw-jacky1n7-openclaw-tavily-search", note: "Tavily search that returns structured results with URLs and snippets. Needs a Tavily API key." },
      { id: "claw-steipete-brave-search", note: "Search and page text extraction through the Brave Search API, with no browser." },
      { id: "claw-robbyczgw-cla-web-search-plus", note: "Routes searches across providers such as Serper, Brave, Tavily, Exa and SearXNG, with freshness filters." },
      { id: "claw-jakelin-ddg-web-search", note: "DuckDuckGo Lite through web_fetch, with no API key, as a fallback when no search API is set up." },
      { id: "claw-uroboros1205-prismfy-search", note: "Searches 10 engines including Google, Reddit, GitHub and arXiv through Prismfy. Needs a Prismfy API key; its description says it sets itself as OpenClaw's default search on install." },
    ],
  },
  {
    slug: "debugging",
    label: "Debugging",
    title: "Best agent skills for debugging",
    description: "Agent skills that make a coding agent find the root cause before it patches, read logs, look into its own failed runs, and prove a fix works.",
    intro:
      "Left alone, an agent tends to guess at a fix, watch one test pass and call it done. These skills slow that down: find the cause first, pull evidence from logs, and run the checks before claiming success.",
    picks: [
      { id: "claw-runesleo-runesleo-systematic-debugging", note: "A four-phase method that investigates the root cause before any fix is attempted." },
      { id: "gh-mattpocock-skills-skills-engineering-diagnosing-bugs", note: "A diagnosis loop for hard bugs and performance regressions. Loads when you say \"debug this\" or report something broken, throwing, failing or slow." },
      { id: "gh-obra-superpowers-skills-verification-before-completion", note: "Makes the agent run verification commands and read the output before it says work is fixed or passing, commits, or opens a PR." },
      { id: "claw-gitgoodordietrying-log-analyzer", note: "Parses and searches logs across formats, finds error patterns, reads stack traces and correlates events across services." },
      { id: "claw-ivangdavila-api", note: "For third-party REST and GraphQL calls that return 401, 403 or 429, time out, hit CORS errors or return wrong data. Includes notes on 147 services." },
      { id: "gh-affaan-m-ecc-agents-skills-agent-introspection-debugging", note: "For when the agent run itself fails: capture, diagnosis, contained recovery and a written report, instead of a blind retry." },
      { id: "claw-steipete-oracle", note: "Bundles a prompt and the relevant files with the @steipete/oracle CLI to get a second model's review of a bug, refactor or design." },
    ],
  },
  {
    slug: "agent-memory",
    label: "Agent memory",
    title: "Best agent skills for memory and self-improvement",
    description: "Agent skills that save corrections and lessons, set up long-term memory, and clean it out, so an agent stops repeating the same mistakes.",
    intro:
      "An agent starts each session with no memory of the last one unless something writes it down. These skills log what went wrong, turn on memory search, or prune memory that has filled with junk. Several are built for OpenClaw or Clawdbot, and the notes say which.",
    picks: [
      { id: "claw-pskoett-self-improving-agent", note: "Logs errors, corrections and better approaches as they come up, and reviews the saved guidance before major tasks." },
      { id: "claw-ivangdavila-self-improving", note: "Has the agent check its own work, catch mistakes and keep what it learns in self-organizing memory. Triggers on failures, corrections and rejected work." },
      { id: "claw-stevengonsalvez-reflect-learn", note: "Pulls lessons from your corrections and from patterns that worked, then proposes edits to agent files or new skills. Runs on /reflect or at session end." },
      { id: "claw-oswalpalash-ontology", note: "Stores memory as a typed knowledge graph of people, projects, tasks, events and documents, so skills can share state and link related items." },
      { id: "claw-syajask-memory-setup-openclaw", note: "For OpenClaw: turns on and checks memory_search and memory_get, and sets up MEMORY.md and memory/*.md files when recall is poor." },
      { id: "claw-marmikcfc-memory-manager", note: "Local memory for agents: warns when context compression could lose memory, saves snapshots, and searches past memories." },
      { id: "claw-dylanbaker24-memory-hygiene", note: "For Clawdbot: audits and cleans its LanceDB vector memory when it fills with junk or irrelevant recalls push up token use." },
    ],
  },
  {
    slug: "email",
    label: "Email",
    title: "Best agent skills for email",
    description: "Agent skills that let an agent read, search, draft and send email in Gmail, Outlook or any IMAP inbox, or give it an inbox of its own.",
    intro:
      "Email is where an agent can handle real admin work for you, and also where a mistake goes out under your name. Most of these skills can send mail, so check what access each one needs and have it draft before you let it send.",
    picks: [
      { id: "claw-steipete-gog", note: "A Google Workspace CLI that covers Gmail along with Calendar, Drive, Contacts, Sheets and Docs." },
      { id: "claw-hith3sh-gmail-email", note: "Searches, reads, drafts and replies to Gmail through the Gmail API, and handles labels, archiving and attachments." },
      { id: "claw-hith3sh-outlook-inbox", note: "Outlook mail, drafts and replies, plus calendar events, contacts and tasks, through Microsoft Graph." },
      { id: "claw-lamelas-himalaya", note: "Lists, reads, writes, replies to and searches mail from the terminal over IMAP and SMTP with the himalaya CLI. Supports multiple accounts." },
      { id: "claw-gzlicanyi-imap-smtp-email", note: "Checks unread mail, searches mailboxes and sends with attachments on any IMAP or SMTP server. Needs Node and asks for your provider, username and password." },
      { id: "claw-adboio-agentmail", note: "Gives an agent its own inboxes through the AgentMail API, with webhooks for incoming mail." },
      { id: "claw-tonimelisma-email-to-calendar", note: "Finds meetings, RSVPs and deadlines in Gmail and creates Google Calendar events after you confirm. Works through the gog CLI." },
    ],
  },
];

export interface ResolvedPick {
  skill: SkillRecord;
  note: string;
}

const byId = new Map(skills.map((skill) => [skill.id, skill]));

export function resolvePicks(topic: BestTopic, catalog: Map<string, SkillRecord> = byId): ResolvedPick[] {
  const out: ResolvedPick[] = [];
  for (const pick of topic.picks) {
    const skill = catalog.get(pick.id);
    if (!skill || skill.scan.flags.length > 0) continue;
    out.push({ skill, note: pick.note });
  }
  return out;
}

export interface InstallHint {
  label: string;
  command: string;
}

// Commands match what each registry shows on its own skill page.
export function installHints(skill: SkillRecord): InstallHint[] {
  const claw = skill.sourceUrl.match(/^https:\/\/clawhub\.ai\/([^/]+)\/skills\/([^/?#]+)/);
  if (claw) {
    const ref = `@${claw[1]}/${claw[2]}`;
    return [
      { label: "OpenClaw", command: `openclaw skills install ${ref}` },
      { label: "ClawHub CLI", command: `clawhub install ${ref}` },
    ];
  }
  const sh = skill.sourceUrl.match(/^https:\/\/(?:www\.)?skills\.sh\/[^/]+\/[^/]+\/([^/?#]+)/);
  if (sh && skill.repo) {
    return [{ label: "skills CLI", command: `npx skills add ${skill.repo} --skill ${sh[1]}` }];
  }
  return [];
}

export function topicBySlug(slug: string): BestTopic | undefined {
  return bestTopics.find((topic) => topic.slug === slug);
}
