import { describe, expect, it } from "vitest";
import { analyticsConfig, analyticsConsent, readAnalyticsConsent, sanitizeAnalyticsReferrer, writeAnalyticsConsent } from "../src/lib/analytics";
import { createAnalyticsConsentRuntime } from "../src/lib/analytics-consent";

describe("pageview analytics", () => {
  it("is a no-op when nothing is configured", () => {
    expect(analyticsConfig({})).toEqual({
      cloudflareToken: null,
      goatcounter: null,
      plausible: null,
      umami: null,
      ga4MeasurementId: null,
    });
  });

  it("accepts a GA4 measurement ID and rejects unsafe IDs", () => {
    expect(analyticsConfig({ ga4MeasurementId: "G-BNS7F8KX6P" }).ga4MeasurementId).toBe("G-BNS7F8KX6P");
    expect(analyticsConfig({ ga4MeasurementId: "g-bns7f8kx6p" }).ga4MeasurementId).toBe("G-BNS7F8KX6P");
    expect(analyticsConfig({ ga4MeasurementId: "G-ABC\" onload=alert(1)" }).ga4MeasurementId).toBeNull();
    expect(analyticsConfig({ ga4MeasurementId: "UA-12345" }).ga4MeasurementId).toBeNull();
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
    expect(config).toEqual({ cloudflareToken: null, goatcounter: null, plausible: null, umami: null, ga4MeasurementId: null });
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

  it("only recognizes explicit analytics consent or revocation", () => {
    expect(analyticsConsent(null)).toBeNull();
    expect(analyticsConsent("anything else")).toBeNull();
    expect(analyticsConsent("allowed")).toBe("allowed");
    expect(analyticsConsent("declined")).toBe("declined");
  });

  it("defaults analytics off when storage is unavailable and keeps a successful choice", () => {
    expect(readAnalyticsConsent(() => { throw new Error("blocked"); })).toBeNull();
    expect(readAnalyticsConsent(() => "allowed")).toBe("allowed");
    expect(writeAnalyticsConsent(() => { throw new Error("blocked"); }, "declined")).toBe(false);
    let stored = "";
    expect(writeAnalyticsConsent((value) => { stored = value; }, "declined")).toBe(true);
    expect(stored).toBe("declined");
  });

  it("removes query data from GA referrers and rejects invalid URLs", () => {
    expect(sanitizeAnalyticsReferrer("https://example.com/private/path?email=me@example.com#section")).toBe("https://example.com/private/path");
    expect(sanitizeAnalyticsReferrer("not a URL")).toBe("");
    expect(sanitizeAnalyticsReferrer("javascript:alert(1)")).toBe("");
  });

  it("does not load analytics until allowed, and revocation disables then reloads", () => {
    const events: string[] = [];
    const runtime = createAnalyticsConsentRuntime({
      initialChoice: null,
      persist: (choice) => { events.push(`persist:${choice}`); return true; },
      onAllow: () => events.push("load"),
      onDecline: () => events.push("disable"),
      onReload: () => events.push("reload"),
    });
    runtime.applyInitialChoice();
    expect(events).toEqual([]);
    runtime.choose("declined");
    expect(events).toEqual(["persist:declined", "disable"]);
    runtime.choose("allowed");
    runtime.choose("allowed");
    expect(events.filter((event) => event === "load")).toHaveLength(1);
    runtime.choose("declined");
    expect(events.slice(-3)).toEqual(["persist:declined", "disable", "reload"]);
  });

  it("does not reload for an initial decline or failed revoke persistence", () => {
    const initialEvents: string[] = [];
    createAnalyticsConsentRuntime({
      initialChoice: "declined",
      persist: () => true,
      onAllow: () => initialEvents.push("load"),
      onDecline: () => initialEvents.push("disable"),
      onReload: () => initialEvents.push("reload"),
    }).applyInitialChoice();
    expect(initialEvents).toEqual(["disable"]);

    const events: string[] = [];
    const storedAllowed = readAnalyticsConsent(() => "allowed");
    const runtime = createAnalyticsConsentRuntime({
      initialChoice: storedAllowed,
      persist: (choice) => writeAnalyticsConsent(() => { throw new Error("blocked"); }, choice),
      onAllow: () => events.push("load"),
      onDecline: () => events.push("disable"),
      onReload: () => events.push("reload"),
    });
    runtime.applyInitialChoice();
    expect(runtime.choose("declined")).toEqual({ persisted: false });
    expect(events).toEqual(["load", "disable"]);
  });
});
