export function buildSeoOptimizationPrompt(
  title: string,
  keyword: string,
  contentMarkdown: string,
  excerpt: string,
): string {
  return `You are an advanced SEO specialist. Optimize the following blog post metadata for maximum search visibility.

Post Title: "${title}"
Focus Keyword: "${keyword}"
Excerpt: "${excerpt}"

Post Content (abbreviated):
${contentMarkdown.slice(0, 4000)}

Generate optimized SEO metadata:
1. **metaTitle**: SEO-optimized title tag (50-60 characters, includes focus keyword near the start, compelling for clicks).
2. **metaDescription**: Meta description (150-160 characters, includes focus keyword, has a clear call-to-action or value proposition).
3. **secondaryKeywords**: Array of 3-5 LSI/secondary keywords naturally present in the content that should be targeted.
4. **readingTime**: Estimated reading time in minutes (assume 200 words per minute).
5. **seoScore**: A score from 0-100 rating the content's SEO quality based on keyword usage, structure, readability, and completeness.
6. **suggestions**: Array of 1-3 specific, actionable improvements to boost the post's SEO (only if score < 90).

Rules:
- Meta title must NOT be identical to the post title — optimize it for SERP click-through.
- Meta description should read like an ad — clear benefit, urgency, or curiosity.
- Secondary keywords should be semantically related, not just synonyms.
- Be honest about the SEO score — don't inflate it.

Return your response as JSON matching the exact schema provided.`;
}

export const seoOptimizationSchema = {
  name: "SeoOptimization",
  schema: {
    type: "object" as const,
    properties: {
      metaTitle: { type: "string" as const },
      metaDescription: { type: "string" as const },
      secondaryKeywords: {
        type: "array" as const,
        items: { type: "string" as const },
      },
      readingTime: { type: "integer" as const },
      seoScore: { type: "integer" as const },
      suggestions: {
        type: "array" as const,
        items: { type: "string" as const },
      },
    },
    required: ["metaTitle", "metaDescription", "secondaryKeywords", "readingTime", "seoScore", "suggestions"],
    additionalProperties: false,
  },
};
