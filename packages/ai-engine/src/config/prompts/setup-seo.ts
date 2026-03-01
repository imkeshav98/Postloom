export function buildSetupSeoPrompt(
  niche: string,
  blogName: string,
  blogDescription: string | null,
  categoryNames: string[],
): string {
  return `You are an expert SEO strategist. A new ${niche} blog needs its site-level SEO metadata configured.

Blog Name: "${blogName}"
Niche: "${niche}"
${blogDescription ? `Current Description: "${blogDescription}"` : "No description set yet."}
Categories: ${categoryNames.join(", ")}

Generate:
1. **metaDescription**: A compelling meta description for the blog's homepage (150-160 characters). Optimize for the niche. Include a call-to-action.
2. **ogTitle**: Open Graph title for social sharing (50-60 characters). Should be attention-grabbing.
3. **ogDescription**: Open Graph description for social sharing (100-150 characters).
4. **refinedDescription**: An improved blog description (1-2 sentences, 100-200 characters). Should be SEO-friendly and clearly communicate the blog's value proposition.
5. **siteKeywords**: 5 high-level keywords that represent the blog's content focus. These are site-wide keywords, not individual post keywords.

Return your response as JSON matching the exact schema provided.`;
}

export const setupSeoSchema = {
  name: "SetupSeo",
  schema: {
    type: "object" as const,
    properties: {
      metaDescription: { type: "string" as const },
      ogTitle: { type: "string" as const },
      ogDescription: { type: "string" as const },
      refinedDescription: { type: "string" as const },
      siteKeywords: {
        type: "array" as const,
        items: { type: "string" as const },
      },
    },
    required: ["metaDescription", "ogTitle", "ogDescription", "refinedDescription", "siteKeywords"],
    additionalProperties: false,
  },
};
