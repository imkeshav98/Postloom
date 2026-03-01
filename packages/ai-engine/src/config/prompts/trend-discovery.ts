export function buildTrendDiscoveryPrompt(
  niche: string,
  nicheDescription: string,
  contentGaps: string[],
  recommendedTopics: string[],
): string {
  return `You are an expert trend analyst specializing in content marketing. Identify currently trending topics in the given niche that would make excellent blog content.

Niche: "${niche}"

Niche Profile:
${nicheDescription}

Content Gaps to Target:
${contentGaps.map((g) => `- ${g}`).join("\n")}

Recommended Topics:
${recommendedTopics.map((t) => `- ${t}`).join("\n")}

Your task:

1. Identify 10-15 topics that are currently trending or gaining momentum in this niche.
2. For each trend, provide a trend score (0.0 to 1.0, where 1.0 = extremely hot right now).
3. For each trend, suggest 3-5 specific keywords that would make good blog post targets.

Consider:
- Seasonal trends (time of year)
- Emerging subtopics gaining search interest
- Recent news or developments in the niche
- Social media buzz topics
- New products, techniques, or research in the field
- The content gaps and recommended topics above — prioritize trends that align with these

Return your response as JSON matching the exact schema provided.`;
}

export const trendDiscoverySchema = {
  name: "TrendDiscovery",
  schema: {
    type: "object" as const,
    properties: {
      trends: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            topic: { type: "string" as const },
            trendScore: { type: "number" as const },
            description: { type: "string" as const },
            suggestedKeywords: {
              type: "array" as const,
              items: { type: "string" as const },
            },
          },
          required: [
            "topic",
            "trendScore",
            "description",
            "suggestedKeywords",
          ],
          additionalProperties: false,
        },
      },
    },
    required: ["trends"],
    additionalProperties: false,
  },
};
