export function buildTopicClusteringPrompt(
  niche: string,
  postTitle: string,
  keyword: string,
  existingCategories: Array<{ name: string; slug: string; isPillar: boolean; postCount: number }>,
): string {
  return `You are an expert SEO content architect. Assign the following blog post to a topic cluster using the hub-and-spoke model.

Niche: "${niche}"
New Post Title: "${postTitle}"
Target Keyword: "${keyword}"

Existing categories on this blog:
${existingCategories.length > 0
    ? existingCategories.map((c) => `- ${c.name} (slug: ${c.slug}, pillar: ${c.isPillar}, posts: ${c.postCount})`).join("\n")
    : "- No categories yet"}

Determine:
1. **categoryName**: Which existing category this post belongs to, OR suggest a new category name if none fit.
2. **categorySlug**: URL-friendly slug for the category.
3. **isNewCategory**: Whether this is a new category that needs to be created.
4. **isPillar**: Whether this post should be a pillar/hub page (comprehensive guide on a broad topic) or a spoke (focused article on a subtopic).
5. **clusterGroup**: A short identifier for the topic cluster (e.g., "home-workouts", "nutrition-basics").
6. **reasoning**: Brief explanation of why this categorization makes sense.

Rules:
- Prefer existing categories when possible.
- A pillar page should be a comprehensive guide covering a broad topic. Spokes are focused subtopics.
- Each cluster group should have exactly 1 pillar and multiple spokes.

Return your response as JSON matching the exact schema provided.`;
}

export const topicClusteringSchema = {
  name: "TopicCluster",
  schema: {
    type: "object" as const,
    properties: {
      categoryName: { type: "string" as const },
      categorySlug: { type: "string" as const },
      isNewCategory: { type: "boolean" as const },
      isPillar: { type: "boolean" as const },
      clusterGroup: { type: "string" as const },
      reasoning: { type: "string" as const },
    },
    required: ["categoryName", "categorySlug", "isNewCategory", "isPillar", "clusterGroup", "reasoning"],
    additionalProperties: false,
  },
};
