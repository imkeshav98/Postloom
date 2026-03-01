export function buildContentPlanningPrompt(
  niche: string,
  keyword: string,
  searchVolume: number,
  difficulty: number,
  intent: string,
  existingPostTitles: string[],
): string {
  return `You are an expert content strategist. Create a detailed blog post plan for the following keyword.

Niche: "${niche}"
Target Keyword: "${keyword}"
Search Volume: ${searchVolume}
Difficulty: ${difficulty}/100
Search Intent: ${intent}

Existing posts on this blog (avoid overlap):
${existingPostTitles.length > 0 ? existingPostTitles.map((t) => `- ${t}`).join("\n") : "- No existing posts yet"}

Create a plan that includes:
1. **title**: An SEO-optimized, click-worthy blog post title (60-70 characters, includes the target keyword naturally).
2. **slug**: A URL-friendly slug derived from the title (lowercase, hyphens, no stop words).
3. **outline**: A detailed outline with H2 and H3 headings, 6-10 sections. Each section should have a brief description of what to cover.
4. **targetWordCount**: Recommended word count (1200-2500 based on keyword difficulty and intent).
5. **contentType**: The format that works best (how-to, listicle, comparison, review, guide, case-study).
6. **uniqueAngle**: What makes this post different from competitors.

Return your response as JSON matching the exact schema provided.`;
}

export const contentPlanningSchema = {
  name: "ContentPlan",
  schema: {
    type: "object" as const,
    properties: {
      title: { type: "string" as const },
      slug: { type: "string" as const },
      outline: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            heading: { type: "string" as const },
            level: { type: "integer" as const },
            description: { type: "string" as const },
          },
          required: ["heading", "level", "description"],
          additionalProperties: false,
        },
      },
      targetWordCount: { type: "integer" as const },
      contentType: { type: "string" as const },
      uniqueAngle: { type: "string" as const },
    },
    required: ["title", "slug", "outline", "targetWordCount", "contentType", "uniqueAngle"],
    additionalProperties: false,
  },
};
