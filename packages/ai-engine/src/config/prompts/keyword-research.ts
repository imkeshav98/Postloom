export function buildKeywordResearchPrompt(
  niche: string,
  nicheProfile: string,
  contentGaps: string[],
  recommendedTopics: string[],
  existingKeywords: string[],
): string {
  const existingSection = existingKeywords.length > 0
    ? `\nExisting keywords already in our database:\n${existingKeywords.map((k) => `- ${k}`).join("\n")}\n`
    : "";

  return `You are an expert SEO keyword researcher. Based on the niche analysis below, generate a comprehensive list of blog post keywords.

Niche: "${niche}"

Niche Profile:
${nicheProfile}

Content Gaps to Target:
${contentGaps.map((g) => `- ${g}`).join("\n")}

Recommended Topics:
${recommendedTopics.map((t) => `- ${t}`).join("\n")}
${existingSection}
Generate 20-30 keywords that would make good blog post targets. For each keyword:

1. **keyword**: The exact search query people type into Google (long-tail preferred, 3-6 words).
2. **searchVolume**: Estimated monthly search volume (your best estimate as an integer).
3. **difficulty**: How hard it is to rank (0-100 scale, where 0 = easy, 100 = impossible).
4. **cpc**: Estimated cost-per-click in USD (for monetization potential).
5. **intent**: The search intent — one of: INFORMATIONAL, NAVIGATIONAL, TRANSACTIONAL, COMMERCIAL.

Keyword uniqueness:
- Do NOT repeat exact keywords or very close rewording (e.g. "how to lose belly fat" vs "how to lose belly fat fast" — these are too similar).
- Related keywords in the same topic area ARE fine as long as they would produce a clearly different article (e.g. "belly fat causes hormonal imbalance" is fine alongside "how to lose belly fat").

Focus on:
- Long-tail keywords (easier to rank for new blogs)
- Mix of difficulty levels (some easy wins, some ambitious targets)
- Keywords with commercial/transactional intent (monetization potential)
- Keywords that fill the identified content gaps

Return your response as JSON matching the exact schema provided.`;
}

export const keywordResearchSchema = {
  name: "KeywordResearch",
  schema: {
    type: "object" as const,
    properties: {
      keywords: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            keyword: { type: "string" as const },
            searchVolume: { type: "integer" as const },
            difficulty: { type: "number" as const },
            cpc: { type: "number" as const },
            intent: {
              type: "string" as const,
              enum: ["INFORMATIONAL", "NAVIGATIONAL", "TRANSACTIONAL", "COMMERCIAL"],
            },
          },
          required: ["keyword", "searchVolume", "difficulty", "cpc", "intent"],
          additionalProperties: false,
        },
      },
    },
    required: ["keywords"],
    additionalProperties: false,
  },
};
