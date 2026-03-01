export function buildNicheAnalysisPrompt(niche: string): string {
  return `You are an expert SEO content strategist. Analyze the following blog niche and provide a comprehensive research report.

Niche: "${niche}"

Your analysis must include:

1. **Niche Profile**: A concise description of this niche, its size, and monetization potential.

2. **Target Audience**: Who reads content in this niche — their age range, interests, pain points, and what they're searching for.

3. **Competitors**: List 5-8 top websites/blogs in this niche. For each, note what they do well and where they have gaps.

4. **Content Gaps**: Identify 5-10 specific topic areas that are underserved — topics with demand but limited high-quality content.

5. **Recommended Topics**: Suggest 10-15 specific blog post ideas that would perform well in this niche, considering search intent and competition.

6. **Content Types**: What formats work best in this niche (how-to guides, listicles, comparison posts, reviews, case studies, etc.).

Return your response as JSON matching the exact schema provided.`;
}

export const nicheAnalysisSchema = {
  name: "NicheAnalysis",
  schema: {
    type: "object" as const,
    properties: {
      nicheProfile: {
        type: "object" as const,
        properties: {
          description: { type: "string" as const },
          marketSize: { type: "string" as const },
          monetizationPotential: { type: "string" as const },
        },
        required: ["description", "marketSize", "monetizationPotential"],
        additionalProperties: false,
      },
      targetAudience: {
        type: "object" as const,
        properties: {
          ageRange: { type: "string" as const },
          interests: { type: "array" as const, items: { type: "string" as const } },
          painPoints: { type: "array" as const, items: { type: "string" as const } },
          searchBehavior: { type: "string" as const },
        },
        required: ["ageRange", "interests", "painPoints", "searchBehavior"],
        additionalProperties: false,
      },
      competitors: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            name: { type: "string" as const },
            url: { type: "string" as const },
            strengths: { type: "string" as const },
            weaknesses: { type: "string" as const },
          },
          required: ["name", "url", "strengths", "weaknesses"],
          additionalProperties: false,
        },
      },
      contentGaps: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            topic: { type: "string" as const },
            opportunity: { type: "string" as const },
          },
          required: ["topic", "opportunity"],
          additionalProperties: false,
        },
      },
      recommendedTopics: {
        type: "array" as const,
        items: { type: "string" as const },
      },
      contentTypes: {
        type: "array" as const,
        items: { type: "string" as const },
      },
    },
    required: [
      "nicheProfile",
      "targetAudience",
      "competitors",
      "contentGaps",
      "recommendedTopics",
      "contentTypes",
    ],
    additionalProperties: false,
  },
};
