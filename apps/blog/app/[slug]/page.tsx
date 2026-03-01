import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getBlogConfig,
  getPost,
  getRelatedPosts,
  getAdjacentPosts,
} from "@/lib/data";
import { PostBody } from "@/components/PostBody";
import { Sidebar } from "@/components/Sidebar";
import { FaqAccordion } from "@/components/FaqAccordion";
import { PostNav } from "@/components/PostNav";
import {
  JsonLd,
  blogPostingSchema,
  breadcrumbSchema,
  faqSchema,
} from "@/components/JsonLd";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};

  const blog = await getBlogConfig();
  const blogUrl = blog.domain ? `https://${blog.domain}` : "";
  const image = post.images[0];

  return {
    title: post.metaTitle ?? post.title,
    description: post.metaDescription ?? post.excerpt ?? undefined,
    openGraph: {
      title: post.metaTitle ?? post.title,
      description: post.metaDescription ?? post.excerpt ?? undefined,
      url: `${blogUrl}/${post.slug}`,
      type: "article",
      publishedTime: post.publishedAt
        ? new Date(post.publishedAt).toISOString()
        : undefined,
      modifiedTime: new Date(post.updatedAt).toISOString(),
      images: image ? [{ url: image.url, alt: image.altText }] : undefined,
    },
    alternates: {
      canonical: post.canonicalUrl ?? `${blogUrl}/${post.slug}`,
    },
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const blog = await getBlogConfig();
  const blogUrl = blog.domain ? `https://${blog.domain}` : "";

  const [relatedPosts, adjacentPosts] = await Promise.all([
    post.categoryId
      ? getRelatedPosts(post.categoryId, post.id)
      : Promise.resolve([]),
    post.publishedAt
      ? getAdjacentPosts(new Date(post.publishedAt), post.id)
      : Promise.resolve({ prev: null, next: null }),
  ]);

  const thumbnail = post.images[0];
  const date = post.publishedAt
    ? new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(new Date(post.publishedAt))
    : null;

  // Parse FAQ data
  const faqItems = Array.isArray(post.faqData)
    ? (post.faqData as { question: string; answer: string }[])
    : [];

  // AdSense slot
  const adsenseSlots = blog.siteConfig?.adsenseSlots as Record<
    string,
    string
  > | null;
  const adsenseSlot = adsenseSlots?.sidebar ?? null;

  return (
    <>
      {/* JSON-LD */}
      <JsonLd
        data={blogPostingSchema({
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          contentMarkdown: post.contentMarkdown,
          publishedAt: post.publishedAt,
          updatedAt: post.updatedAt,
          images: post.images,
          wordCount: post.wordCount,
          author: blog.defaultAuthor,
          blogName: blog.name,
          blogUrl,
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: blogUrl || "/" },
          ...(post.category
            ? [
                {
                  name: post.category.name,
                  url: `${blogUrl}/category/${post.category.slug}`,
                },
              ]
            : []),
          { name: post.title, url: `${blogUrl}/${post.slug}` },
        ])}
      />
      {faqItems.length > 0 && <JsonLd data={faqSchema(faqItems)} />}

      {/* Post header */}
      <header className="animate-fade-in px-4 pt-32 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          {/* Breadcrumb-style meta */}
          <div className="mb-5 flex items-center justify-center gap-3 text-sm text-muted">
            {post.category && (
              <Link
                href={`/category/${post.category.slug}`}
                className="rounded-full border border-accent/40 px-3 py-1 font-medium text-accent transition-colors hover:bg-accent/5"
              >
                {post.category.name}
              </Link>
            )}
            {date && (
              <time className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted/60">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                {date}
              </time>
            )}
            {post.readingTime && (
              <span className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted/60">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
                {post.readingTime} min read
              </span>
            )}
          </div>

          <h1 className="mb-8 text-3xl font-bold leading-tight text-content md:text-4xl lg:text-5xl">
            {post.title}
          </h1>
        </div>
      </header>

      {/* Featured image */}
      {thumbnail && (
        <div className="animate-fade-in-up px-4 sm:px-6 lg:px-8">
          <div className="relative mx-auto aspect-video max-w-5xl overflow-hidden rounded-3xl shadow-lg shadow-black/8">
            <Image
              src={thumbnail.url}
              alt={thumbnail.altText}
              fill
              sizes="(max-width: 1280px) 100vw, 1280px"
              className="object-cover"
              priority
            />
          </div>
        </div>
      )}

      {/* Content + Sidebar */}
      <div className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_300px]">
          {/* Main content */}
          <article className="animate-fade-in">
            <PostBody
              contentMarkdown={post.contentMarkdown}
              contentHtml={post.contentHtml}
            />

            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="mt-10 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <a
                    key={tag.id}
                    href={`/tag/${tag.slug}`}
                    className="rounded-full border border-edge bg-surface-alt/50 px-3 py-1.5 text-xs font-medium text-muted transition-all duration-200 hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                  >
                    #{tag.name}
                  </a>
                ))}
              </div>
            )}

            {/* Author */}
            <div className="mt-10 rounded-2xl border border-edge/60 bg-surface-alt/30 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-fill text-sm font-bold text-white">
                  {blog.defaultAuthor.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-content">
                    {blog.defaultAuthor}
                  </p>
                  <p className="text-xs text-muted">Author</p>
                </div>
              </div>
            </div>

            {/* FAQ */}
            {faqItems.length > 0 && <FaqAccordion items={faqItems} />}

            {/* Prev/Next */}
            <PostNav prev={adjacentPosts.prev} next={adjacentPosts.next} />
          </article>

          {/* Sidebar */}
          <Sidebar
            relatedPosts={relatedPosts}
            author={blog.defaultAuthor}
            adsenseSlot={adsenseSlot}
          />
        </div>
      </div>
    </>
  );
}
