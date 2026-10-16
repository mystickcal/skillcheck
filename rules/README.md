# Compatibility rules

SkillCheck reads these YAML files when it labels a skill. Each file has a version. The labels are `compatible`, `likely`, and `needs changes`. A label is a reading of frontmatter and a few file facts. It is not a test run inside the agent.

Facts the engine can check live in `scripts/lib/facts.ts`. A rule fires when its `when` fact is true. `needs_changes` outranks `likely`. `info` does not change the label. It is shown only when the label stays `compatible`.

## Sources checked on 2026-10-16

Agent Skills spec. `name` and `description` are required. `name` is 1 to 64 characters, lowercase letters, numbers, and hyphens. `description` is 1 to 1024 characters. Optional fields include `license`, `compatibility`, `metadata`, and experimental `allowed-tools`. Unknown fields are ignored.

https://agentskills.io/specification

Claude Code. Frontmatter is optional. `description` is recommended and, if missing, Claude Code uses the first non-empty body line. `name` defaults to the directory name. Claude Code reads `allowed-tools`, `model`, `when_to_use`, `context`, `agent`, `hooks`, `paths`, and related fields. It accepts `metadata` and does not act on it.

https://code.claude.com/docs/en/skills

OpenClaw. Skills use `SKILL.md` frontmatter. A skill with no `metadata.openclaw` block stays eligible unless config disables it. `metadata.openclaw.requires` can require bins, env vars, and config. `os` limits the platform. Current docs say the pre-July 2026 clawdbot format is no longer read. The ClawHub skill format page still lists `metadata.clawdbot` and `metadata.clawdis` as aliases, so a file that only has those keys is marked needs changes.

https://docs.openclaw.ai/tools/skills

https://docs.openclaw.ai/clawhub/skill-format

Hermes. The validator requires frontmatter, `name`, `description`, and a non-empty body. The authoring guide also shows `version`, `author`, `license`, `platforms`, `metadata.hermes` (tags, related skills, toolset and tool gates), and `required_environment_variables`. The repo authoring standard caps `name` at 64 characters and asks for a short description. The validator text we checked enforces presence, not the 60 character description style note, so a long description stays compatible.

https://hermes-agent.nousresearch.com/docs/developer-guide/creating-skills

https://hermes-agent.nousresearch.com/docs/user-guide/skills/bundled/software-development/software-development-hermes-agent-skill-authoring

Codex. The parser in current `codex-rs` source requires frontmatter, a non-empty `description`, and a `name` of at most 64 characters. A missing name falls back to the directory name. Extra keys are ignored. `metadata.short-description` is kept as a short label. The body can be empty. Product docs also describe optional `agents/openai.yaml`, which this index does not fetch.

https://github.com/openai/codex/blob/main/codex-rs/skills/src/parser.rs

https://learn.chatgpt.com/docs/build-skills

## How to change a rule

1. Edit the agent YAML file.
2. Bump `version` when the reading changes.
3. Add or update a hand-labeled fixture in `tests/fixtures/labeled.json`.
4. Run `npm test`.
