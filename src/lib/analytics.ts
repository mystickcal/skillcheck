const TOKEN = /^[A-Za-z0-9_-]{8,128}$/;
const GOATCOUNTER = /^https:\/\/[a-z0-9-]+\.goatcounter\.com\/count$/;
const DOMAIN = /^[a-z0-9.-]+$/;
const HTTPS_SCRIPT = /^https:\/\/[a-z0-9.-]+\/[a-zA-Z0-9._~/-]+$/;

export type PlausibleSnippet = { domain: string; src: string };

export type AnalyticsConfig = {
  cloudflareToken: string | null;
  goatcounter: string | null;
  plausible: PlausibleSnippet | null;
};

export function analyticsConfig(env: {
  cloudflareToken?: string;
  goatcounter?: string;
  plausibleDomain?: string;
  plausibleScript?: string;
}): AnalyticsConfig {
  const cloudflare = env.cloudflareToken?.trim() ?? "";
  const goat = env.goatcounter?.trim() ?? "";
  const domain = env.plausibleDomain?.trim() ?? "";
  const script = (env.plausibleScript?.trim() || "https://plausible.io/js/script.js").trim();
  return {
    cloudflareToken: TOKEN.test(cloudflare) ? cloudflare : null,
    goatcounter: GOATCOUNTER.test(goat) ? goat : null,
    plausible: DOMAIN.test(domain) && HTTPS_SCRIPT.test(script) ? { domain, src: script } : null,
  };
}
