/** Kept after quality filters. Combined target stays above 500. */
export const DEFAULT_CLAWHUB_MAX = 520;
export const DEFAULT_SKILLSSH_MAX = 200;

export function numberEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}
