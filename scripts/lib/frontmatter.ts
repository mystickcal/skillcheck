import { parse } from "yaml";

export type ParsedSkill = {
  frontmatter: Record<string, unknown> | null;
  body: string;
  keys: string[];
};

export function parseSkillMarkdown(text: string): ParsedSkill {
  const normalized = text.replace(/^\uFEFF/, "");
  if (!normalized.startsWith("---")) {
    return { frontmatter: null, body: normalized.trim(), keys: [] };
  }
  const end = normalized.indexOf("\n---", 3);
  if (end === -1) {
    return { frontmatter: null, body: normalized.trim(), keys: [] };
  }
  const raw = normalized.slice(3, end).replace(/^\r?\n/, "");
  const after = normalized.slice(end + 4).replace(/^\r?\n/, "");
  try {
    const parsed = parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { frontmatter: null, body: normalized.trim(), keys: [] };
    }
    const frontmatter = normalizeMetadata(parsed as Record<string, unknown>);
    return { frontmatter, body: after.trim(), keys: dottedKeys(frontmatter) };
  } catch {
    return { frontmatter: null, body: normalized.trim(), keys: [] };
  }
}

function normalizeMetadata(frontmatter: Record<string, unknown>): Record<string, unknown> {
  const metadata = frontmatter.metadata;
  if (typeof metadata !== "string") return frontmatter;
  const trimmed = metadata.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return frontmatter;
  try {
    const value = JSON.parse(trimmed) as unknown;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return { ...frontmatter, metadata: value };
    }
  } catch {
    return frontmatter;
  }
  return frontmatter;
}

export function dottedKeys(value: unknown, prefix = ""): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return prefix ? [prefix] : [];
  }
  const entries = Object.keys(value as Record<string, unknown>);
  if (entries.length === 0) return prefix ? [prefix] : [];
  const keys: string[] = [];
  if (prefix) keys.push(prefix);
  for (const key of entries) {
    const next = prefix ? `${prefix}.${key}` : key;
    const child = (value as Record<string, unknown>)[key];
    if (child && typeof child === "object" && !Array.isArray(child)) {
      keys.push(...dottedKeys(child, next));
    } else {
      keys.push(next);
    }
  }
  return keys;
}

export function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function stringList(value: unknown): string[] {
  if (typeof value === "string") {
    return value
      .split(/[,\s]+/)
      .map((part) => part.trim())
      .filter(Boolean);
  }
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (item && typeof item === "object" && "name" in item) {
        const name = (item as { name?: unknown }).name;
        return typeof name === "string" ? name.trim() : "";
      }
      return "";
    })
    .filter(Boolean);
}
