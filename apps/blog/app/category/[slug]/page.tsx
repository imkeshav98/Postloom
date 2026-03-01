import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlogConfig, getPosts } from "@/lib/data";
import { PostCard } from "@/components/PostCard";
import { Pagination } from "@/components/Pagination";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const blog = await getBlogConfig();
  const category = blog.categories.find((c) => c.slug === slug);
  if (!category) return {};

  return {
    title: category.name,
    description:
      category.description ?? `${category.name} articles on ${blog.name}`,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const blog = await getBlogConfig();
  const category = blog.categories.find((c) => c.slug === slug);
  if (!category) notFound();

  const page = Math.max(1, Number(sp.page) || 1);
  const perPage = blog.siteConfig?.postsPerPage ?? 9;
  const { posts, totalPages } = await getPosts(page, perPage, slug);

  return (
    <section className="px-4 pb-14 pt-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="animate-fade-in mb-10">
          <div className="mb-4 flex items-center gap-2 text-sm text-muted">
            <Link href="/" className="transition-colors hover:text-accent">
              Home
            </Link>
            <span className="text-muted/40">/</span>
            <span className="text-content">{category.name}</span>
          </div>
          <h1 className="mb-3 text-3xl font-bold text-primary md:text-4xl">
            {category.name}
          </h1>
          {category.description && (
            <p className="max-w-2xl text-muted">{category.description}</p>
          )}
        </div>

        {posts.length > 0 ? (
          <div className="stagger-children grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                author={blog.defaultAuthor}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center py-20 text-center">
            <p className="text-xl font-semibold text-content">
              No posts in this category yet
            </p>
            <p className="mt-2 text-sm text-muted">
              Check back soon for new content.
            </p>
          </div>
        )}

        <div className="mt-14">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            basePath={`/category/${slug}`}
          />
        </div>
      </div>
    </section>
  );
}
