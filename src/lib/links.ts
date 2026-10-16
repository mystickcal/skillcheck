const repo = "https://github.com/mystickcal/skillcheck";

export function claimUrl(id: string, sourceUrl: string): string {
  const params = new URLSearchParams({
    template: "claim-skill.yml",
    title: `Claim skill: ${id}`,
    labels: "claim",
  });
  params.set("skill-id", id);
  params.set("source-url", sourceUrl);
  return `${repo}/issues/new?${params.toString()}`;
}

export const repoUrl = repo;
