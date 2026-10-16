import type { ScanFlag } from "./types.js";

const CHECKS: Array<{ id: string; summary: string; pattern: RegExp }> = [
  {
    id: "pipe-to-shell",
    summary: "Pipe to a shell. A download is sent into sh, bash, or a similar shell.",
    pattern:
      /\b(curl|wget|fetch)\b[^\n]{0,240}\|\s*(sudo\s+)?(ba)?sh\b|\b(bash|sh|zsh)\s*<\s*\(\s*(curl|wget)\b/i,
  },
  {
    id: "base64-blob",
    summary: "Base64 blob. The text decodes base64 or includes a long base64-looking run.",
    pattern: /base64\s+(?:-d|--decode)|atob\s*\(|(?:[A-Za-z0-9+/]{240,}={0,2})/,
  },
  {
    id: "credential-path",
    summary:
      "Credential or keychain path. The text names an SSH key, cloud credential file, keychain, or browser login store.",
    pattern:
      /~\/\.ssh\/|\/\.aws\/credentials|\.npmrc|\.netrc|id_rsa|keychain|Login Data|Cookies\.binarycookies|credentials\.json/i,
  },
  {
    id: "obfuscated-url",
    summary: "Obfuscated URL. The text uses a disguised scheme, a raw IP host, or an encoded http scheme.",
    pattern: /hxxps?:\/\/|https?:\/\/(?:\d{1,3}\.){3}\d{1,3}\b|https?%3A%2F%2F/i,
  },
];

export function scanTexts(texts: string[]): { label: string; flags: ScanFlag[] } {
  const flags: ScanFlag[] = [];
  const combined = texts.join("\n");
  for (const check of CHECKS) {
    if (check.pattern.test(combined)) {
      flags.push({ id: check.id, summary: check.summary });
    }
  }
  if (flags.length === 0) {
    return { label: "scanned, no flags", flags: [] };
  }
  return { label: "scanned, flags found", flags };
}
