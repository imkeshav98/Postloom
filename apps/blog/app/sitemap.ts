import type { MetadataRoute } from "next";
import { getBlogConfig, getAllPostSlugs, getAllCategorySlugs } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const blog = await getBlogConfig();
  const baseUrl = blog.domain ? `https://${blog.domain}` : "http://localhost:3000";

  const posts = await getAllPostSlugs();
  const categories = await getAllCategorySlugs();

  const entries: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ];

  for (const post of posts) {
    entries.push({
      url: `${baseUrl}/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  for (const cat of categories) {
    entries.push({
      url: `${baseUrl}/category/${cat.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    });
  }

  return entries;
}
