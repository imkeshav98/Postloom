export function buildInternalLinkingPrompt(
  currentPostTitle: string,
  currentPostContent: string,
  existingPosts: Array<{ id: string; title: string; slug: string; excerpt: string | null }>,
): string {
  return `You are an SEO expert specializing in internal linking strategy. Analyze the blog post below and suggest internal links to other posts on the same blog.

Current Post Title: "${currentPostTitle}"
Current Post Content (abbreviated):
${currentPostContent.slice(0, 3000)}

Other published posts on this blog:
${existingPosts.length > 0
    ? existingPosts.map((p) => `- [${p.title}] (id: ${p.id}, slug: ${p.slug})${p.excerpt ? ` — ${p.excerpt}` : ""}`).join("\n")
    : "- No other posts yet"}

For each suggested link, provide:
1. **targetPostId**: The id of the post to link to.
2. **anchorText**: Natural anchor text to use (2-6 words, descriptive, not "click here").
3. **context**: The sentence or paragraph where this link should be inserted.
4. **reasoning**: Why this link adds value for the reader.

Rules:
- Only suggest links that are genuinely relevant and add value to the reader.
- Maximum 5 internal links per post.
- Prefer linking to topically related content that deepens the reader's understanding.
- Use varied, natural anchor text — avoid keyword stuffing.
- If no existing posts are relevant, return an empty array.

Return your response as JSON matching the exact schema provided.`;
}

export const internalLinkingSchema = {
  name: "InternalLinks",
  schema: {
    type: "object" as const,
    properties: {
      links: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            targetPostId: { type: "string" as const },
            anchorText: { type: "string" as const },
            context: { type: "string" as const },
            reasoning: { type: "string" as const },
          },
          required: ["targetPostId", "anchorText", "context", "reasoning"],
          additionalProperties: false,
        },
      },
    },
    required: ["links"],
    additionalProperties: false,
  },
};
