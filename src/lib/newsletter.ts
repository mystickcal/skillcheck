export const NEWSLETTER_BRAND = "skillcheck";
export const NEWSLETTER_SOURCE = "skillcheck-web";
export const SUCCESS_MESSAGE = "Check your inbox to confirm";
export const ERROR_MESSAGE = "We could not send that signup. Try again in a moment.";
export const HOSTED_FORM_URL = "https://newsletter.clickconsultants.com/subscription/form";
export const DEFAULT_GATEWAY = "https://newsletter.clickconsultants.com";

export type SubscriptionBody = {
  email: string;
  brand: typeof NEWSLETTER_BRAND;
  source: string;
  consent: true;
  company: string;
  "cf-turnstile-response"?: string;
};

export function newsletterEnabled(value: string | undefined): boolean {
  return value === "true";
}

export function newsletterEndpoint(gateway: string | undefined): string {
  const base = (gateway && gateway.trim() ? gateway.trim() : DEFAULT_GATEWAY).replace(/\/+$/, "");
  return `${base}/v1/subscriptions`;
}

export function subscriptionBody(input: {
  email: string;
  company: string;
  consent: boolean;
  turnstileToken?: string;
}): SubscriptionBody | null {
  const email = input.email.trim();
  if (!input.consent || email.length === 0) return null;
  const body: SubscriptionBody = {
    email,
    brand: NEWSLETTER_BRAND,
    source: NEWSLETTER_SOURCE,
    consent: true,
    company: input.company,
  };
  const token = input.turnstileToken?.trim();
  if (token) body["cf-turnstile-response"] = token;
  return body;
}
