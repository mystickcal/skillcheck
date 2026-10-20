import { describe, expect, it } from "vitest";
import { analyticsConfig } from "../src/lib/analytics";

describe("pageview analytics", () => {
  it("is a no-op when nothing is configured", () => {
    expect(analyticsConfig({})).toEqual({
      cloudflareToken: null,
      goatcounter: null,
      plausible: null,
      umami: null,
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
    expect(config).toEqual({ cloudflareToken: null, goatcounter: null, plausible: null, umami: null });
  });

  it("accepts an https Umami script with a UUID website id and rejects anything else", () => {
    expect(
      analyticsConfig({
        umamiSrc: "https://newsletter.clickconsultants.com/u/script.js",
        umamiWebsiteId: "b69f59fe-cb2c-4241-9011-2aa78b8ff69e",
      }).umami,
    ).toEqual({
      src: "https://newsletter.clickconsultants.com/u/script.js",
      websiteId: "b69f59fe-cb2c-4241-9011-2aa78b8ff69e",
    });
    expect(analyticsConfig({ umamiSrc: "http://insecure.example/script.js", umamiWebsiteId: "b69f59fe-cb2c-4241-9011-2aa78b8ff69e" }).umami).toBeNull();
    expect(analyticsConfig({ umamiSrc: "https://newsletter.clickconsultants.com/u/script.js", umamiWebsiteId: "not-a-uuid\" onload=\"x" }).umami).toBeNull();
    expect(analyticsConfig({ umamiSrc: "https://newsletter.clickconsultants.com/u/script.js" }).umami).toBeNull();
  });
});
