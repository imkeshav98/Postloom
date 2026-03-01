export function buildInternalLinkingPrompt(
  currentPostTitle: string,
  currentPostSlug: string,
  currentPostContent: string,
  existingPosts: Array<{ id: string; title: string; slug: string; excerpt: string | null }>,
): string {
  return `You are an SEO expert specializing in internal linking strategy. Analyze the blog post below and suggest bidirectional internal links.

Current Post Title: "${currentPostTitle}"
Current Post Slug: "${currentPostSlug}"
Current Post Content (abbreviated):
${currentPostContent.slice(0, 3000)}

Other published posts on this blog:
${existingPosts.length > 0
    ? existingPosts.map((p) => `- [${p.title}] (id: ${p.id}, slug: ${p.slug})${p.excerpt ? ` — ${p.excerpt}` : ""}`).join("\n")
    : "- No other posts yet"}

Suggest TWO types of links:

**forwardLinks** — Links FROM the current post TO existing posts:
For each, provide:
- **targetPostId**: The id of the existing post to link to.
- **anchorText**: Natural anchor text (2-6 words).
- **searchPhrase**: A short phrase (5-15 words) that appears verbatim or nearly verbatim in the current post's content, near where this link should go. Pick an actual sentence fragment from the content above.

**reverseLinks** — Links FROM existing posts TO the current (new) post:
For each, provide:
- **sourcePostId**: The id of the existing post that should link to the current post.
- **anchorText**: Natural anchor text (2-6 words) for the link to the current post.

Rules:
- Only suggest links that are genuinely relevant and add value to the reader.
- Maximum 5 forward links and 3 reverse links.
- Prefer linking to topically related content that deepens the reader's understanding.
- Use varied, natural anchor text — avoid keyword stuffing.
- For searchPhrase, pick a real phrase from the content so the link can be inserted at that location.
- If no existing posts are relevant, return empty arrays.

Return your response as JSON matching the exact schema provided.`;
}

export const internalLinkingSchema = {
  name: "InternalLinks",
  schema: {
    type: "object" as const,
    properties: {
      forwardLinks: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            targetPostId: { type: "string" as const },
            anchorText: { type: "string" as const },
            searchPhrase: { type: "string" as const },
          },
          required: ["targetPostId", "anchorText", "searchPhrase"],
          additionalProperties: false,
        },
      },
      reverseLinks: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            sourcePostId: { type: "string" as const },
            anchorText: { type: "string" as const },
          },
          required: ["sourcePostId", "anchorText"],
          additionalProperties: false,
        },
      },
    },
    required: ["forwardLinks", "reverseLinks"],
    additionalProperties: false,
  },
};
