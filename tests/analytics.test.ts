import { describe, expect, it } from "vitest";
import { analyticsConfig } from "../src/lib/analytics";

describe("pageview analytics", () => {
  it("is a no-op when nothing is configured", () => {
    expect(analyticsConfig({})).toEqual({
      cloudflareToken: null,
      goatcounter: null,
      plausible: null,
    });
  });

  it("accepts a Cloudflare token, GoatCounter count URL, or Plausible domain", () => {
    const config = analyticsConfig({
      cloudflareToken: "abcdef1234567890",
      goatcounter: "https://skillcheck.goatcounter.com/count",
      plausibleDomain: "mystickcal.github.io",
    });
    expect(config.cloudflareToken).toBe("abcdef1234567890");
    expect(config.goatcounter).toBe("https://skillcheck.goatcounter.com/count");
    expect(config.plausible).toEqual({
      domain: "mystickcal.github.io",
      src: "https://plausible.io/js/script.js",
    });
  });

  it("rejects values that are not safe to put in a script tag", () => {
    const config = analyticsConfig({
      cloudflareToken: "bad token",
      goatcounter: "https://evil.example/count",
      plausibleDomain: "bad domain",
      plausibleScript: "http://insecure.example/script.js",
    });
    expect(config).toEqual({ cloudflareToken: null, goatcounter: null, plausible: null });
  });
});
