const TOKEN = /^[A-Za-z0-9_-]{8,128}$/;
const GOATCOUNTER = /^https:\/\/[a-z0-9-]+\.goatcounter\.com\/count$/;
const DOMAIN = /^[a-z0-9.-]+$/;
const HTTPS_SCRIPT = /^https:\/\/[a-z0-9.-]+\/[a-zA-Z0-9._~/-]+$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const GA4_MEASUREMENT_ID = /^G-[A-Z0-9]{6,16}$/;

export type PlausibleSnippet = { domain: string; src: string };
export type UmamiSnippet = { src: string; websiteId: string };
export type AnalyticsConsent = "allowed" | "declined" | null;

export type AnalyticsConfig = {
  cloudflareToken: string | null;
  goatcounter: string | null;
  plausible: PlausibleSnippet | null;
  umami: UmamiSnippet | null;
  ga4MeasurementId: string | null;
};

export function analyticsConfig(env: {
  cloudflareToken?: string;
  goatcounter?: string;
  plausibleDomain?: string;
  plausibleScript?: string;
  umamiSrc?: string;
  umamiWebsiteId?: string;
  ga4MeasurementId?: string;
}): AnalyticsConfig {
  const cloudflare = env.cloudflareToken?.trim() ?? "";
  const goat = env.goatcounter?.trim() ?? "";
  const domain = env.plausibleDomain?.trim() ?? "";
  const umamiSrc = env.umamiSrc?.trim() ?? "";
  const umamiId = env.umamiWebsiteId?.trim().toLowerCase() ?? "";
  const ga4MeasurementId = env.ga4MeasurementId?.trim().toUpperCase() ?? "";
  const script = (env.plausibleScript?.trim() || "https://plausible.io/js/script.js").trim();
  return {
    cloudflareToken: TOKEN.test(cloudflare) ? cloudflare : null,
    goatcounter: GOATCOUNTER.test(goat) ? goat : null,
    plausible: DOMAIN.test(domain) && HTTPS_SCRIPT.test(script) ? { domain, src: script } : null,
    umami: HTTPS_SCRIPT.test(umamiSrc) && UUID.test(umamiId) ? { src: umamiSrc, websiteId: umamiId } : null,
    ga4MeasurementId: GA4_MEASUREMENT_ID.test(ga4MeasurementId) ? ga4MeasurementId : null,
  };
}

export function analyticsConsent(value: string | null | undefined): AnalyticsConsent {
  return value === "allowed" || value === "declined" ? value : null;
}

export function readAnalyticsConsent(read: () => string | null): AnalyticsConsent {
  try {
    return analyticsConsent(read());
  } catch {
    return null;
  }
}

export function writeAnalyticsConsent(write: (value: Exclude<AnalyticsConsent, null>) => void, value: Exclude<AnalyticsConsent, null>): boolean {
  try {
    write(value);
    return true;
  } catch {
    return false;
  }
}

export function sanitizeAnalyticsReferrer(value: string): string {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? `${url.origin}${url.pathname}` : "";
  } catch {
    return "";
  }
}
