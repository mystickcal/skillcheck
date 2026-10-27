export type PublicPageType = "AboutPage" | "CollectionPage" | "WebPage";

interface SchemaInput {
  site: URL | string;
  basePath: string;
  pathname: string;
  title: string;
  description: string;
}

function normalizedBasePath(basePath: string): string {
  return `/${basePath.replace(/^\/+|\/+$/g, "")}`.replace(/\/$/, "") || "/";
}

export function publicPageType(pathname: string, basePath: string): PublicPageType {
  const base = normalizedBasePath(basePath);
  const relative = base === "/" ? pathname : pathname.startsWith(base) ? pathname.slice(base.length) || "/" : pathname;
  if (relative === "/about/" || relative === "/about") return "AboutPage";
  if (relative === "/" || relative === "/best/" || relative === "/best") return "CollectionPage";
  return "WebPage";
}

export function buildPublicSchema(input: SchemaInput): Record<string, unknown> {
  const base = normalizedBasePath(input.basePath);
  const site = new URL(input.site);
  const websiteUrl = new URL(base === "/" ? "/" : `${base}/`, site).href;
  const canonical = new URL(input.pathname, site).href;
  const websiteId = `${websiteUrl}#website`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebSite", "@id": websiteId, name: "SkillCheck", url: websiteUrl, inLanguage: "en" },
      {
        "@type": publicPageType(new URL(canonical).pathname, base),
        "@id": `${canonical}#webpage`,
        url: canonical,
        name: input.title,
        description: input.description,
        inLanguage: "en",
        isPartOf: { "@id": websiteId },
      },
    ],
  };
}

export function serializeJsonLd(value: Record<string, unknown>): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
