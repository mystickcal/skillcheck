import { describe, expect, it } from "vitest";
import { buildPublicSchema, publicPageType, serializeJsonLd } from "../src/lib/schema.js";

const site = "https://mystickcal.github.io";
const basePath = "/skillcheck/";

describe("public JSON-LD", () => {
  it("keeps a stable SkillCheck WebSite identity on the deployed base path", () => {
    const graph = buildPublicSchema({
      site,
      basePath,
      pathname: "/skillcheck/about/",
      title: "About SkillCheck",
      description: "How SkillCheck reads skills.",
    })["@graph"] as Array<Record<string, unknown>>;
    expect(graph[0]).toMatchObject({
      "@type": "WebSite",
      "@id": "https://mystickcal.github.io/skillcheck/#website",
      url: "https://mystickcal.github.io/skillcheck/",
      name: "SkillCheck",
      inLanguage: "en",
    });
    expect(graph[1]).toMatchObject({
      "@type": "AboutPage",
      "@id": "https://mystickcal.github.io/skillcheck/about/#webpage",
      isPartOf: { "@id": "https://mystickcal.github.io/skillcheck/#website" },
    });
  });

  it("uses contextual types only where the visible page supports them", () => {
    expect(publicPageType("/skillcheck/", basePath)).toBe("CollectionPage");
    expect(publicPageType("/skillcheck/best/", basePath)).toBe("CollectionPage");
    expect(publicPageType("/skillcheck/skills/example/", basePath)).toBe("WebPage");
    expect(publicPageType("/skillcheck/best/testing/", basePath)).toBe("WebPage");
  });

  it("serializes JSON-LD safely for an inline script", () => {
    const json = serializeJsonLd({ description: "</script><img src=x>&\u2028" });
    expect(json).not.toContain("</script>");
    expect(json).toContain("\\u003c/script\\u003e");
    expect(json).toContain("\\u003e");
    expect(json).toContain("\\u0026");
    expect(JSON.parse(json)).toEqual({ description: "</script><img src=x>&\u2028" });
  });
});
