export const AGENTS = ["hermes", "openclaw", "claude-code", "codex"] as const;

export type AgentId = (typeof AGENTS)[number];

export type Status = "compatible" | "likely" | "needs_changes";

export type Effect = "info" | Status;

export type Check = {
  id: string;
  when: string;
  effect: Effect;
  reason: string;
};

export type RuleFile = {
  version: number;
  agent: AgentId;
  title: string;
  spec_url: string;
  retrieved: string;
  compatible_reason: string;
  checks: Check[];
};

export type FactFlags = {
  no_frontmatter: boolean;
  missing_name: boolean;
  missing_description: boolean;
  empty_body: boolean;
  name_longer_than_64: boolean;
  name_not_spec_shape: boolean;
  description_longer_than_1024: boolean;
  has_allowed_tools: boolean;
  has_model: boolean;
  has_claude_only_fields: boolean;
  has_openclaw_metadata: boolean;
  has_openclaw_requires: boolean;
  has_openclaw_os: boolean;
  has_legacy_clawdbot: boolean;
  has_hermes_metadata: boolean;
  has_hermes_gates: boolean;
  has_codex_short_description: boolean;
  has_scripts_dir: boolean;
  mentions_network: boolean;
  has_compatibility_field: boolean;
};

export type Facts = FactFlags & {
  bins: string[];
  env: string[];
  tools: string[];
};

export type ScanFlag = {
  id: string;
  summary: string;
};

export type GithubInfo = {
  stars: number;
  lastPush: string | null;
  openIssuesAndPullRequests: number;
  license: string | null;
  archived: boolean;
};

export type Health = "active" | "quiet" | "archived" | "unknown";

export type SkillSource = {
  name: "clawhub" | "skills.sh";
  url: string;
};

export type RegistryStat =
  | { source: "clawhub"; downloads: number; stars: number }
  | { source: "skills.sh"; installs: number };

export type SkillRecord = {
  id: string;
  name: string;
  description: string;
  sourceUrl: string;
  repo: string | null;
  path: string;
  author: string | null;
  tags: string[];
  category: string;
  frontmatterKeys: string[];
  sources: SkillSource[];
  bins: string[];
  env: string[];
  tools: string[];
  hasScriptsDir: boolean;
  mentionsNetwork: boolean;
  compatibility: Record<
    AgentId,
    { status: Status; reasons: string[] }
  >;
  github: GithubInfo | null;
  health: Health;
  scan: {
    label: string;
    flags: ScanFlag[];
  };
  registry: RegistryStat | null;
  contentSha: string | null;
  analyzedAt: string;
};

export type Analysis = {
  name: string;
  description: string;
  author: string | null;
  tags: string[];
  frontmatterKeys: string[];
  facts: Facts;
  compatibility: SkillRecord["compatibility"];
  scan: SkillRecord["scan"];
};
