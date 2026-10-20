import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("nightly publish", () => {
  const nightly = readFileSync(".github/workflows/nightly.yml", "utf8");

  it("commits data to main and deploys that build to GitHub Pages", () => {
    expect(nightly).not.toContain("bot/nightly-ingest");
    expect(nightly).toContain('git push origin HEAD:main');
    expect(nightly).toContain('refs/heads/main');
    expect(nightly).toContain("actions/deploy-pages@v4");
    expect(nightly).toContain("actions/upload-pages-artifact@v3");
    expect(nightly).toContain("group: pages");
  });
});
