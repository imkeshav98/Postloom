import { prisma } from "@autoblog/database";
import { unstable_cache } from "next/cache";

function blogId(): string {
  const id = process.env.BLOG_ID;
  if (!id) throw new Error("BLOG_ID environment variable is required");
  return id;
}

// ─── Blog config ───────────────────────────────────────────────────────────

export async function getBlogConfig() {
  const id = blogId();
  const fn = unstable_cache(
    async () => {
      return prisma.blog.findUniqueOrThrow({
        where: { id },
        include: {
          siteConfig: true,
          categories: { orderBy: { name: "asc" } },
        },
      });
    },
    ["blog-config", id],
    { tags: ["blog-config"], revalidate: 3600 },
  );
  return fn();
}

// ─── Paginated posts ───────────────────────────────────────────────────────

export async function getPosts(
  page: number,
  perPage: number,
  categorySlug?: string,
) {
  const id = blogId();
  const fn = unstable_cache(
    async (pg: number, pp: number, catSlug?: string) => {
      const where: Record<string, unknown> = {
        blogId: id,
        status: "PUBLISHED" as const,
      };

      if (catSlug) {
        where.category = { slug: catSlug };
      }

      const [posts, total] = await Promise.all([
        prisma.post.findMany({
          where,
          include: {
            category: true,
            images: { take: 1 },
          },
          orderBy: { publishedAt: "desc" },
          skip: (pg - 1) * pp,
          take: pp,
        }),
        prisma.post.count({ where }),
      ]);

      return { posts, total, totalPages: Math.ceil(total / pp) };
    },
    ["posts", id, String(page), String(perPage), categorySlug ?? "all"],
    { tags: ["posts"], revalidate: 300 },
  );

  return fn(page, perPage, categorySlug);
}

// ─── Single post ───────────────────────────────────────────────────────────

export async function getPost(slug: string) {
  const id = blogId();
  const fn = unstable_cache(
    async (s: string) => {
      return prisma.post.findUnique({
        where: { blogId_slug: { blogId: id, slug: s } },
        include: {
          category: true,
          tags: true,
          images: true,
        },
      });
    },
    ["post", id, slug],
    { tags: [`post-${slug}`, "posts"], revalidate: 300 },
  );

  return fn(slug);
}

// ─── Related posts ─────────────────────────────────────────────────────────

export async function getRelatedPosts(
  categoryId: string,
  excludePostId: string,
  limit = 4,
) {
  const id = blogId();
  const fn = unstable_cache(
    async (catId: string, exId: string, lim: number) => {
      return prisma.post.findMany({
        where: {
          blogId: id,
          status: "PUBLISHED",
          categoryId: catId,
          id: { not: exId },
        },
        include: { category: true, images: { take: 1 } },
        orderBy: { publishedAt: "desc" },
        take: lim,
      });
    },
    ["related-posts", id, categoryId, excludePostId, String(limit)],
    { tags: ["posts"], revalidate: 300 },
  );

  return fn(categoryId, excludePostId, limit);
}

// ─── Adjacent posts (prev/next) ────────────────────────────────────────────

export async function getAdjacentPosts(publishedAt: Date, postId: string) {
  const id = blogId();
  const fn = unstable_cache(
    async (pubAt: string, pId: string) => {
      const date = new Date(pubAt);

      const [prev, next] = await Promise.all([
        prisma.post.findFirst({
          where: {
            blogId: id,
            status: "PUBLISHED",
            publishedAt: { lt: date },
            id: { not: pId },
          },
          orderBy: { publishedAt: "desc" },
          select: { title: true, slug: true },
        }),
        prisma.post.findFirst({
          where: {
            blogId: id,
            status: "PUBLISHED",
            publishedAt: { gt: date },
            id: { not: pId },
          },
          orderBy: { publishedAt: "asc" },
          select: { title: true, slug: true },
        }),
      ]);

      return { prev, next };
    },
    ["adjacent-posts", id, publishedAt.toISOString(), postId],
    { tags: ["posts"], revalidate: 300 },
  );

  return fn(publishedAt.toISOString(), postId);
}

// ─── Posts by tag ──────────────────────────────────────────────────────────

export async function getPostsByTag(
  tagSlug: string,
  page: number,
  perPage: number,
) {
  const id = blogId();
  const fn = unstable_cache(
    async (ts: string, pg: number, pp: number) => {
      const where = {
        blogId: id,
        status: "PUBLISHED" as const,
        tags: { some: { slug: ts } },
      };

      const [posts, total] = await Promise.all([
        prisma.post.findMany({
          where,
          include: { category: true, images: { take: 1 } },
          orderBy: { publishedAt: "desc" },
          skip: (pg - 1) * pp,
          take: pp,
        }),
        prisma.post.count({ where }),
      ]);

      return { posts, total, totalPages: Math.ceil(total / pp) };
    },
    ["posts-by-tag", id, tagSlug, String(page), String(perPage)],
    { tags: ["posts"], revalidate: 300 },
  );

  return fn(tagSlug, page, perPage);
}

// ─── Tag by slug ───────────────────────────────────────────────────────────

export async function getTag(slug: string) {
  const id = blogId();
  return prisma.tag.findUnique({
    where: { blogId_slug: { blogId: id, slug } },
  });
}

// ─── Single page (about, privacy, etc.) ──────────────────────────────────

export async function getPage(slug: string) {
  const id = blogId();
  const fn = unstable_cache(
    async (s: string) => {
      return prisma.page.findUnique({
        where: { blogId_slug: { blogId: id, slug: s } },
      });
    },
    ["page", id, slug],
    { tags: [`page-${slug}`, "pages"], revalidate: 3600 },
  );
  return fn(slug);
}

// ─── All slugs (for sitemap) ───────────────────────────────────────────────

export async function getAllPostSlugs() {
  const id = blogId();
  const fn = unstable_cache(
    async () => {
      return prisma.post.findMany({
        where: { blogId: id, status: "PUBLISHED" },
        select: { slug: true, updatedAt: true },
        orderBy: { publishedAt: "desc" },
      });
    },
    ["all-post-slugs", id],
    { tags: ["posts"], revalidate: 3600 },
  );

  return fn();
}

export async function getAllCategorySlugs() {
  const id = blogId();
  const fn = unstable_cache(
    async () => {
      return prisma.category.findMany({
        where: { blogId: id },
        select: { slug: true },
      });
    },
    ["all-category-slugs", id],
    { tags: ["categories"], revalidate: 3600 },
  );

  return fn();
}
