/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_CF_BEACON_TOKEN?: string;
  readonly PUBLIC_GOATCOUNTER_SRC?: string;
  readonly PUBLIC_PLAUSIBLE_DOMAIN?: string;
  readonly PUBLIC_PLAUSIBLE_SCRIPT?: string;
  readonly PUBLIC_UMAMI_SRC?: string;
  readonly PUBLIC_UMAMI_WEBSITE_ID?: string;
  readonly PUBLIC_GA4_MEASUREMENT_ID?: string;
  readonly PUBLIC_NEWSLETTER_ENABLED?: string;
  readonly PUBLIC_NEWSLETTER_GATEWAY?: string;
  readonly PUBLIC_NEWSLETTER_TURNSTILE_SITE_KEY?: string;
}
