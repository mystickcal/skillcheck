import { describe, expect, it } from "vitest";
import { rateLimitHit } from "../scripts/lib/github.js";
import { DEFAULT_CLAWHUB_MAX, DEFAULT_SKILLSSH_MAX } from "../scripts/lib/limits.js";

describe("ingest limits", () => {
  it("asks for more than 500 skills across both sources", () => {
    expect(DEFAULT_CLAWHUB_MAX).toBeGreaterThan(0);
    expect(DEFAULT_SKILLSSH_MAX).toBeGreaterThan(0);
    expect(DEFAULT_CLAWHUB_MAX + DEFAULT_SKILLSSH_MAX).toBeGreaterThanOrEqual(500);
  });

  it("stops GitHub calls when the API rate limit is spent", () => {
    expect(rateLimitHit(429, "", "0")).toBe(true);
    expect(rateLimitHit(403, "API rate limit exceeded", "0")).toBe(true);
    expect(rateLimitHit(200, "", "0")).toBe(true);
    expect(rateLimitHit(404, "Not Found", "40")).toBe(false);
    expect(rateLimitHit(200, "", "12")).toBe(false);
  });
});
