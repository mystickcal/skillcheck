import { describe, expect, it } from "vitest";
import {
  ERROR_MESSAGE,
  SUCCESS_MESSAGE,
  newsletterEnabled,
  newsletterEndpoint,
  subscriptionBody,
} from "../src/lib/newsletter";

describe("newsletter signup", () => {
  it("stays hidden unless the flag is the string true", () => {
    expect(newsletterEnabled(undefined)).toBe(false);
    expect(newsletterEnabled("false")).toBe(false);
    expect(newsletterEnabled("true")).toBe(true);
  });

  it("posts to the gateway subscriptions path", () => {
    expect(newsletterEndpoint(undefined)).toBe("https://newsletter.clickconsultants.com/v1/subscriptions");
    expect(newsletterEndpoint("https://newsletter.clickconsultants.com/")).toBe(
      "https://newsletter.clickconsultants.com/v1/subscriptions",
    );
  });

  it("matches the live brand contract", () => {
    expect(
      subscriptionBody({
        email: " reader@example.com ",
        company: "",
        consent: true,
      }),
    ).toEqual({
      email: "reader@example.com",
      brand: "skillcheck",
      source: "skillcheck-web",
      consent: true,
      company: "",
    });
  });

  it("drops the request without consent and keeps a turnstile token when present", () => {
    expect(subscriptionBody({ email: "reader@example.com", company: "", consent: false })).toBeNull();
    expect(
      subscriptionBody({
        email: "reader@example.com",
        company: "filled",
        consent: true,
        turnstileToken: "token",
      }),
    ).toMatchObject({
      company: "filled",
      "cf-turnstile-response": "token",
    });
  });

  it("uses the confirm line and never says subscribed", () => {
    expect(SUCCESS_MESSAGE).toBe("Check your inbox to confirm");
    expect(`${SUCCESS_MESSAGE} ${ERROR_MESSAGE}`.toLowerCase()).not.toContain("subscribed");
    expect(`${SUCCESS_MESSAGE} ${ERROR_MESSAGE}`).not.toContain("—");
  });
});
