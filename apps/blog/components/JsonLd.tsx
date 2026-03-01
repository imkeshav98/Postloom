interface JsonLdProps {
  data: Record<string, unknown>;
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// ─── Schema builders ───────────────────────────────────────────────────────

export function blogPostingSchema(post: {
  title: string;
  slug: string;
  excerpt?: string | null;
  contentMarkdown: string;
  publishedAt: Date | null;
  updatedAt: Date;
  images: { url: string; altText: string }[];
  wordCount?: number | null;
  author: string;
  blogName: string;
  blogUrl: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt ?? undefined,
    image: post.images[0]?.url ?? undefined,
    datePublished: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
    dateModified: new Date(post.updatedAt).toISOString(),
    wordCount: post.wordCount ?? undefined,
    url: `${post.blogUrl}/${post.slug}`,
    author: {
      "@type": "Person",
      name: post.author,
    },
    publisher: {
      "@type": "Organization",
      name: post.blogName,
      url: post.blogUrl,
    },
  };
}

export function breadcrumbSchema(
  items: { name: string; url: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function faqSchema(
  items: { question: string; answer: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function collectionPageSchema(page: {
  name: string;
  description: string;
  url: string;
  blogName: string;
  blogUrl: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: page.name,
    description: page.description,
    url: page.url,
    isPartOf: {
      "@type": "WebSite",
      name: page.blogName,
      url: page.blogUrl,
    },
  };
}

export function organizationSchema(blog: {
  name: string;
  url: string;
  description?: string | null;
  logoUrl?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: blog.name,
    url: blog.url,
    description: blog.description ?? undefined,
    logo: blog.logoUrl ?? undefined,
  };
}
