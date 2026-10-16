export type Expected = "compatible" | "likely" | "needs_changes";

export type LabeledFixture = {
  id: string;
  markdown: string;
  expect: Record<"hermes" | "openclaw" | "claude-code" | "codex", Expected>;
};

const agents = {
  hermes: "compatible",
  openclaw: "compatible",
  "claude-code": "compatible",
  codex: "compatible",
} as const;

export const labeled: LabeledFixture[] = [
  {
    id: "plain",
    markdown: `---
name: pdf-processing
description: Extract text from PDFs when the user mentions PDFs.
---
# PDF
Use the instructions in this skill.
`,
    expect: { ...agents },
  },
  {
    id: "missing-name",
    markdown: `---
description: Does a thing when asked.
---
Follow the steps.
`,
    expect: {
      hermes: "needs_changes",
      openclaw: "needs_changes",
      "claude-code": "likely",
      codex: "likely",
    },
  },
  {
    id: "missing-description",
    markdown: `---
name: no-desc
---
Body here.
`,
    expect: {
      hermes: "needs_changes",
      openclaw: "needs_changes",
      "claude-code": "likely",
      codex: "needs_changes",
    },
  },
  {
    id: "no-frontmatter",
    markdown: `# Just a heading
Do the thing.
`,
    expect: {
      hermes: "needs_changes",
      openclaw: "needs_changes",
      "claude-code": "likely",
      codex: "needs_changes",
    },
  },
  {
    id: "empty-body",
    markdown: `---
name: empty-body
description: Has no instructions after frontmatter.
---
`,
    expect: {
      hermes: "needs_changes",
      openclaw: "compatible",
      "claude-code": "compatible",
      codex: "compatible",
    },
  },
  {
    id: "allowed-tools",
    markdown: `---
name: review
description: Review a diff when the user asks for review.
allowed-tools: Read, Grep
---
Read the diff.
`,
    expect: { ...agents },
  },
  {
    id: "model",
    markdown: `---
name: fast-note
description: Write a short note when asked.
model: sonnet
---
Write the note.
`,
    expect: { ...agents },
  },
  {
    id: "openclaw-requires",
    markdown: `---
name: gemini-search
description: Search with the Gemini CLI when asked.
metadata:
  openclaw:
    requires:
      bins: ["gemini"]
      env: ["GEMINI_API_KEY"]
    primaryEnv: GEMINI_API_KEY
---
Run gemini.
`,
    expect: {
      hermes: "likely",
      openclaw: "likely",
      "claude-code": "likely",
      codex: "likely",
    },
  },
  {
    id: "openclaw-emoji",
    markdown: `---
name: hello
description: Say hello when greeted.
metadata:
  openclaw:
    emoji: wave
---
Say hello.
`,
    expect: { ...agents },
  },
  {
    id: "hermes-toolsets",
    markdown: `---
name: web-helper
description: Search the web when asked.
metadata:
  hermes:
    requires_toolsets: [web]
    tags: [Search]
---
Search.
`,
    expect: {
      hermes: "likely",
      openclaw: "likely",
      "claude-code": "likely",
      codex: "likely",
    },
  },
  {
    id: "hermes-env",
    markdown: `---
name: todoist
description: Manage Todoist tasks when asked.
required_environment_variables:
  - name: TODOIST_API_KEY
    required_for: API access
---
Call the API.
`,
    expect: {
      hermes: "likely",
      openclaw: "likely",
      "claude-code": "likely",
      codex: "likely",
    },
  },
  {
    id: "hermes-platforms",
    markdown: `---
name: mac-only
description: Use a Mac-only workflow when asked.
platforms: [macos]
---
Run it.
`,
    expect: {
      hermes: "likely",
      openclaw: "likely",
      "claude-code": "likely",
      codex: "likely",
    },
  },
  {
    id: "long-name",
    markdown: `---
name: this-name-is-way-too-long-for-the-agent-skills-limit-and-should-fail-ok
description: Show the name length limit.
---
Do the task.
`,
    expect: {
      hermes: "likely",
      openclaw: "likely",
      "claude-code": "likely",
      codex: "needs_changes",
    },
  },
  {
    id: "legacy-clawdbot",
    markdown: `---
name: old-skill
description: Legacy metadata example for an old skill.
metadata:
  clawdbot:
    requires:
      bins: ["curl"]
---
Do it.
`,
    expect: {
      hermes: "compatible",
      openclaw: "needs_changes",
      "claude-code": "likely",
      codex: "compatible",
    },
  },
  {
    id: "network-mention",
    markdown: `---
name: fetch-docs
description: Fetch public docs when the user pastes a URL.
---
Use curl to GET the URL and summarize it.
`,
    expect: { ...agents },
  },
  {
    id: "when-to-use",
    markdown: `---
name: pr-review
description: Review pull requests.
when_to_use: When the user pastes a PR link.
---
Review the diff.
`,
    expect: { ...agents },
  },
  {
    id: "context-fork",
    markdown: `---
name: deep-dive
description: Investigate a bug in a forked context.
context: fork
agent: Explore
---
Investigate.
`,
    expect: { ...agents },
  },
  {
    id: "codex-short",
    markdown: `---
name: skill-creator
description: Create or update a skill when asked.
metadata:
  short-description: Create or update a skill
---
Follow the steps.
`,
    expect: { ...agents },
  },
  {
    id: "dual-metadata",
    markdown: `---
name: dual
description: Dual metadata skill for routing mail.
metadata:
  openclaw:
    requires:
      bins: ["himalaya"]
  hermes:
    requires_tools: [terminal]
---
Read mail.
`,
    expect: {
      hermes: "likely",
      openclaw: "likely",
      "claude-code": "likely",
      codex: "likely",
    },
  },
  {
    id: "name-shape",
    markdown: `---
name: PDF_Processing
description: Extract text when the user mentions a PDF.
---
Extract the text.
`,
    expect: {
      hermes: "likely",
      openclaw: "likely",
      "claude-code": "likely",
      codex: "likely",
    },
  },
];
