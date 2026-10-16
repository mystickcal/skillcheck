import raw from "../../data/skills.json";
import type { AgentId, Health, SkillRecord, Status } from "../../scripts/lib/types.ts";

export const skills = raw as SkillRecord[];

export const agentOrder: AgentId[] = ["hermes", "openclaw", "claude-code", "codex"];

export const agentLabels: Record<AgentId, string> = {
  hermes: "Hermes",
  openclaw: "OpenClaw",
  "claude-code": "Claude Code",
  codex: "Codex",
};

export const statusLabels: Record<Status, string> = {
  compatible: "Compatible",
  likely: "Likely",
  needs_changes: "Needs changes",
};

export const healthLabels: Record<Health, string> = {
  active: "Active",
  quiet: "Quiet",
  archived: "Archived",
  unknown: "Unknown",
};

export function skillById(id: string): SkillRecord | undefined {
  return skills.find((skill) => skill.id === id);
}

export function categories(): string[] {
  return [...new Set(skills.map((skill) => skill.category))].sort();
}
