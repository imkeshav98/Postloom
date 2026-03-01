import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlogConfig, getPage } from "@/lib/data";
import { PostBody } from "@/components/PostBody";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) return {};

  const blog = await getBlogConfig();
  const blogUrl = blog.domain ? `https://${blog.domain}` : "";

  return {
    title: page.metaTitle ?? page.title,
    description: page.metaDescription ?? undefined,
    alternates: { canonical: `${blogUrl}/info/${slug}` },
  };
}

export default async function StaticPage({ params }: PageProps) {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) notFound();

  // Strip leading H1 from markdown to avoid duplicate heading
  const markdown = page.contentMarkdown.replace(/^#\s+.+\n+/, "");

  return (
    <section className="px-4 pb-16 pt-32 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Breadcrumb */}
        <div className="animate-fade-in mb-8 flex items-center gap-2 text-sm text-muted">
          <Link href="/" className="transition-colors hover:text-accent">
            Home
          </Link>
          <span className="text-muted/40">/</span>
          <span className="text-content">{page.title}</span>
        </div>

        <h1 className="animate-fade-in mb-10 text-3xl font-bold text-content md:text-4xl">
          {page.title}
        </h1>

        <article className="animate-fade-in">
          <PostBody
            contentMarkdown={markdown}
            contentHtml={page.contentHtml}
          />
        </article>
      </div>
    </section>
  );
}
