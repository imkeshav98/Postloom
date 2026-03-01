export function buildSetupCategoriesPrompt(
  niche: string,
  blogName: string,
  blogDescription: string | null,
): string {
  return `You are an expert blog strategist. A new blog is being set up and needs its category structure defined.

Blog Name: "${blogName}"
Niche: "${niche}"
${blogDescription ? `Description: "${blogDescription}"` : ""}

Create the optimal set of categories for this blog. Use the hub-and-spoke model where pillar categories are broad topics and spoke categories are focused subtopics.

Rules:
- Return between 5 and 10 categories (pick the number that best covers the niche without overlap).
- 2-4 categories should be pillar categories (broad, comprehensive topics). The rest are spoke/supporting categories.
- Each category name should be concise (2-4 words), reader-friendly, and relevant to the niche.
- Slugs must be URL-safe: lowercase, hyphens only, no special characters.
- Each description should be 1-2 sentences explaining what content belongs in that category.
- Categories should cover the niche comprehensively without significant overlap.
- If a category logically belongs under a broader pillar category, set parentSlug to that pillar's slug. Top-level categories have parentSlug as null.

Return your response as JSON matching the exact schema provided.`;
}

export const setupCategoriesSchema = {
  name: "SetupCategories",
  schema: {
    type: "object" as const,
    properties: {
      categories: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            name: { type: "string" as const },
            slug: { type: "string" as const },
            description: { type: "string" as const },
            isPillar: { type: "boolean" as const },
            parentSlug: { type: ["string", "null"] as const },
          },
          required: ["name", "slug", "description", "isPillar", "parentSlug"],
          additionalProperties: false,
        },
      },
      reasoning: { type: "string" as const },
    },
    required: ["categories", "reasoning"],
    additionalProperties: false,
  },
};
