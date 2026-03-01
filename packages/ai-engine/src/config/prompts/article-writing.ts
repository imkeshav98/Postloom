export function buildArticleWritingPrompt(
  niche: string,
  title: string,
  keyword: string,
  outline: Array<{ heading: string; level: number; description: string }>,
  targetWordCount: number,
  contentType: string,
  uniqueAngle: string,
): string {
  return `You are an expert blog writer specializing in the "${niche}" niche. Write a comprehensive, engaging blog post.

Title: "${title}"
Target Keyword: "${keyword}"
Content Type: ${contentType}
Target Word Count: ${targetWordCount}
Unique Angle: ${uniqueAngle}

Outline to follow:
${outline.map((s) => `${"#".repeat(s.level)} ${s.heading}\n${s.description}`).join("\n\n")}

Writing guidelines:
1. Write in a conversational yet authoritative tone.
2. Naturally incorporate the target keyword in the first 100 words, in at least 2 H2 headings, and throughout the body (1-2% density).
3. Use short paragraphs (2-3 sentences max) for readability.
4. Include practical examples, actionable tips, and specific data points where relevant.
5. Use bullet points and numbered lists to break up dense sections.
6. Write an engaging intro that hooks the reader and previews the value of the article.
7. End with a clear conclusion that summarizes key takeaways.
8. Do NOT include a FAQ section in the article body — FAQs will be provided separately in the structured "faq" field.
9. Output the article in clean Markdown format.
10. Do NOT include the title as an H1 — it will be added separately.
11. Generate an "imagePrompt" — a detailed text-to-image prompt for a blog thumbnail. Rules:
    - Style: 3D clay/claymorphism with soft matte textures, rounded inflated shapes, pastel background, and vibrant accent colors. Pick colors that fit the article topic.
    - Focus on 2-4 concrete visual elements that symbolize the article topic (objects, characters, environments).
    - End with: "No text or lettering. 16:9 aspect ratio."

Return your response as JSON matching the exact schema provided.`;
}

export const articleWritingSchema = {
  name: "Article",
  schema: {
    type: "object" as const,
    properties: {
      contentMarkdown: { type: "string" as const },
      excerpt: { type: "string" as const },
      faq: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            question: { type: "string" as const },
            answer: { type: "string" as const },
          },
          required: ["question", "answer"],
          additionalProperties: false,
        },
      },
      wordCount: { type: "integer" as const },
      imagePrompt: { type: "string" as const },
    },
    required: ["contentMarkdown", "excerpt", "faq", "wordCount", "imagePrompt"],
    additionalProperties: false,
  },
};
