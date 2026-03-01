export interface PageSpec {
  slug: string;
  title: string;
  instruction: string;
}

export function getPageSpecs(
  niche: string,
  domain: string | null,
): PageSpec[] {
  const siteUrl = domain ? `https://${domain}` : "https://example.com";
  const contactEmail = `contact@${domain ?? "example.com"}`;

  return [
    {
      slug: "about",
      title: "About",
      instruction: `Write an **About** page. Introduce the blog, its mission, what readers can expect, and the team/author behind it. Make it warm, engaging, and authentic. 300-500 words.`,
    },
    {
      slug: "privacy-policy",
      title: "Privacy Policy",
      instruction: `Write a complete **Privacy Policy** page in full. This must be a comprehensive legal page with 800-1200 words minimum. Cover ALL of the following sections with detailed content:
1. Information We Collect (personal data, usage data, cookies)
2. How We Use Your Information
3. Cookies and Tracking Technologies (Google Analytics, Google AdSense)
4. Third-Party Services and Links
5. Data Retention
6. Your Privacy Rights (GDPR, CCPA)
7. Children's Privacy
8. Changes to This Privacy Policy
9. Contact Us for Privacy Questions
Use "${siteUrl}" as the site URL. Do NOT abbreviate or truncate any section.`,
    },
    {
      slug: "terms-of-service",
      title: "Terms of Service",
      instruction: `Write a **Terms of Service** page. Cover: acceptance of terms, intellectual property, user conduct, disclaimers of warranty, limitation of liability, governing law, and changes to terms. 600-1000 words.`,
    },
    {
      slug: "contact",
      title: "Contact",
      instruction: `Write a **Contact** page with a friendly introduction, email address (${contactEmail}), and social media placeholders. Encourage readers to reach out with questions, feedback, or collaboration ideas. 200-300 words.`,
    },
    {
      slug: "disclaimer",
      title: "Disclaimer",
      instruction: `Write a **Disclaimer** page. Cover: general information disclaimer (not professional advice), affiliate links disclosure, sponsored content disclosure, accuracy of information, and external links disclaimer. Relevant to a ${niche} blog. 400-600 words.`,
    },
  ];
}

export function buildSinglePagePrompt(
  spec: PageSpec,
  niche: string,
  blogName: string,
  blogDescription: string | null,
  authorName: string,
  domain: string | null,
): string {
  const siteUrl = domain ? `https://${domain}` : "https://example.com";

  return `You are an expert content writer. Generate the content for a static page on a ${niche} blog.

Blog Name: "${blogName}"
Niche: "${niche}"
${blogDescription ? `Description: "${blogDescription}"` : ""}
Author/Team: "${authorName}"
Site URL: ${siteUrl}

${spec.instruction}

Write the content in **Markdown format**. Use proper headings, lists, bold text, and paragraphs.
Do NOT use any internal links to other pages on the site.

Also provide:
- A concise metaTitle (50-60 characters, includes blog name)
- A metaDescription (150-160 characters)

Return your response as JSON matching the exact schema provided.`;
}

export const singlePageSchema = {
  name: "SetupSinglePage",
  schema: {
    type: "object" as const,
    properties: {
      title: { type: "string" as const },
      contentMarkdown: { type: "string" as const },
      metaTitle: { type: "string" as const },
      metaDescription: { type: "string" as const },
    },
    required: ["title", "contentMarkdown", "metaTitle", "metaDescription"],
    additionalProperties: false,
  },
};
