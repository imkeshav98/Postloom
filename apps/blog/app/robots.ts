import type { MetadataRoute } from "next";
import { getBlogConfig } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const blog = await getBlogConfig();
  const baseUrl = blog.domain ? `https://${blog.domain}` : "http://localhost:3000";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
