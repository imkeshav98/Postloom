export interface TrendContext {
  topic: string;
  trendScore: number;
  description: string;
  suggestedKeywords: string[];
}

export function buildKeywordResearchPrompt(
  niche: string,
  nicheProfile: string,
  contentGaps: string[],
  recommendedTopics: string[],
  existingKeywords: string[],
  trends: TrendContext[],
): string {
  const existingSection = existingKeywords.length > 0
    ? `\nExisting keywords already in our database (do NOT repeat these):\n${existingKeywords.map((k) => `- ${k}`).join("\n")}\n`
    : "";

  // Collect all trend-suggested keywords for the AI to research with metrics
  const trendSuggestedKeywords = trends.flatMap((t) => t.suggestedKeywords);
  const uniqueSuggested = [...new Set(trendSuggestedKeywords)]
    .filter((k) => !existingKeywords.includes(k.toLowerCase()));

  const trendSection = trends.length > 0
    ? `\nCurrent Trends in This Niche:
${trends.map((t) => `- **${t.topic}** (trend score: ${t.trendScore}) — ${t.description}`).join("\n")}

Trend-Suggested Keywords to Include:
${uniqueSuggested.map((k) => `- ${k}`).join("\n")}

IMPORTANT: You MUST include the trend-suggested keywords above in your output (with full metrics). Also generate additional keywords beyond these.
`
    : "";

  return `You are an elite SEO keyword strategist. Your job is to find high-value, rankable keywords that a new blog can actually win on.

Niche: "${niche}"

Niche Profile:
${nicheProfile}

Content Gaps to Target:
${contentGaps.map((g) => `- ${g}`).join("\n")}

Recommended Topics:
${recommendedTopics.map((t) => `- ${t}`).join("\n")}
${existingSection}${trendSection}
Generate exactly 10 high-quality keywords. For each keyword provide:

1. **keyword**: The exact search query people type into Google. Use natural, conversational phrasing (3-7 words). Must be specific enough to write a focused 2000+ word article about.
2. **searchVolume**: Estimated monthly search volume (integer). Prefer keywords with 500+ monthly searches.
3. **difficulty**: SEO difficulty score (0-100). Target the sweet spot: difficulty 15-45 (rankable for new blogs within 3-6 months).
4. **cpc**: Estimated cost-per-click in USD (higher = more monetization potential).
5. **intent**: Search intent — INFORMATIONAL, NAVIGATIONAL, TRANSACTIONAL, or COMMERCIAL.
6. **trendScore**: If this keyword relates to a current trend, use the trend's score (0.0-1.0). Otherwise 0.

## STRICT UNIQUENESS RULES
Each keyword MUST target a completely different article topic. Apply this test: "Would a reader click on BOTH articles?" If yes, the keywords are too similar — keep only the stronger one.

BAD (too similar — same article):
- "postpartum workouts" vs "new mom fitness" vs "postpartum exercise plan"
- "vegan muscle gain" vs "build muscle vegan" vs "vegan bodybuilding tips"
- "10 min workouts" vs "quick home workouts" vs "short exercise routines"

GOOD (each is a distinct article):
- "diastasis recti exercises after pregnancy" (specific medical condition)
- "vegan creatine sources for muscle" (specific nutrient focus)
- "desk stretch routine for back pain" (specific context + problem)

## KEYWORD SELECTION PRIORITY (in order)
1. **Low difficulty + high volume + trending** — the golden combination. These are rare, find them.
2. **Low difficulty + trending** — easy to rank AND riding a wave of interest.
3. **Low difficulty + high volume** — steady traffic, easy to capture.
4. **Moderate difficulty + very high volume** — worth the effort for big payoff.

Avoid: difficulty > 60 (too hard for new blogs), searchVolume < 300 (not enough traffic), generic 1-2 word keywords (too competitive).

## KEYWORD STYLE
- Prefer "how to", "best", "vs", question-format keywords — these match featured snippet opportunities
- Include at least 3 COMMERCIAL or TRANSACTIONAL intent keywords (monetizable)
- Every keyword should feel like a real search query a person would type, not a topic label

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
            trendScore: { type: "number" as const },
          },
          required: ["keyword", "searchVolume", "difficulty", "cpc", "intent", "trendScore"],
          additionalProperties: false,
        },
      },
    },
    required: ["keywords"],
    additionalProperties: false,
  },
};
