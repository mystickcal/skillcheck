import { asRecord, stringList, type ParsedSkill } from "./frontmatter.js";
import type { FactFlags, Facts } from "./types.js";

const CLAUDE_ONLY = [
  "when_to_use",
  "argument-hint",
  "arguments",
  "disable-model-invocation",
  "user-invocable",
  "disallowed-tools",
  "effort",
  "context",
  "agent",
  "background",
  "hooks",
  "paths",
  "shell",
];

const NAME_SHAPE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const FACT_KEYS = [
  "no_frontmatter",
  "missing_name",
  "missing_description",
  "empty_body",
  "name_longer_than_64",
  "name_not_spec_shape",
  "description_longer_than_1024",
  "has_allowed_tools",
  "has_model",
  "has_claude_only_fields",
  "has_openclaw_metadata",
  "has_openclaw_requires",
  "has_openclaw_os",
  "has_legacy_clawdbot",
  "has_hermes_metadata",
  "has_hermes_gates",
  "has_codex_short_description",
  "has_scripts_dir",
  "mentions_network",
  "has_compatibility_field",
] as const;

export function buildFacts(parsed: ParsedSkill, hasScriptsDir: boolean): Facts {
  const fm = parsed.frontmatter;
  const name = typeof fm?.name === "string" ? fm.name.trim() : "";
  const description = typeof fm?.description === "string" ? fm.description.trim() : "";
  const metadata = asRecord(fm?.metadata);
  const openclaw = asRecord(metadata?.openclaw);
  const hermes = asRecord(metadata?.hermes);
  const requires = asRecord(openclaw?.requires);
  const legacy = Boolean(metadata?.clawdbot || metadata?.clawdis);
  const hermesGates = Boolean(
    hermes?.requires_toolsets ||
      hermes?.requires_tools ||
      hermes?.fallback_for_toolsets ||
      hermes?.fallback_for_tools ||
      fm?.required_environment_variables ||
      fm?.platforms,
  );
  const tools = stringList(fm?.["allowed-tools"]);
  const bins = [...stringList(requires?.bins), ...stringList(requires?.anyBins)];
  const env = [
    ...stringList(requires?.env),
    ...stringList(openclaw?.primaryEnv),
    ...stringList(openclaw?.envVars),
    ...stringList(fm?.required_environment_variables),
  ];
  const short = metadata?.["short-description"] ?? metadata?.short_description;

  const flags: FactFlags = {
    no_frontmatter: fm === null,
    missing_name: name.length === 0,
    missing_description: description.length === 0,
    empty_body: parsed.body.trim().length === 0,
    name_longer_than_64: name.length > 64,
    name_not_spec_shape: name.length > 0 && !NAME_SHAPE.test(name),
    description_longer_than_1024: description.length > 1024,
    has_allowed_tools: tools.length > 0,
    has_model: typeof fm?.model === "string" && fm.model.trim().length > 0,
    has_claude_only_fields: CLAUDE_ONLY.some((key) => fm?.[key] !== undefined),
    has_openclaw_metadata: openclaw !== null,
    has_openclaw_requires: requires !== null,
    has_openclaw_os: openclaw?.os !== undefined,
    has_legacy_clawdbot: legacy && openclaw === null,
    has_hermes_metadata: hermes !== null,
    has_hermes_gates: hermesGates,
    has_codex_short_description: typeof short === "string" && short.trim().length > 0,
    has_scripts_dir: hasScriptsDir,
    mentions_network: /\b(curl|wget|https?:\/\/|web_search)\b/i.test(parsed.body),
    has_compatibility_field: typeof fm?.compatibility === "string",
  };

  return {
    ...flags,
    bins: unique(bins),
    env: unique(env),
    tools: unique(tools).slice(0, 12),
  };
}

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}
