import type { Metadata } from "next";
import { getBlogConfig, getPosts } from "@/lib/data";
import { PostCard } from "@/components/PostCard";
import { FeaturedPost } from "@/components/FeaturedPost";
import { CategoryFilter } from "@/components/CategoryFilter";
import { Pagination } from "@/components/Pagination";
import { JsonLd, organizationSchema } from "@/components/JsonLd";

interface HomeProps {
  searchParams: Promise<{ page?: string; category?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const blog = await getBlogConfig();
  const url = blog.domain ? `https://${blog.domain}` : undefined;
  const ogImageUrl = blog.siteConfig?.ogImageUrl;

  return {
    title: blog.name,
    description: blog.description ?? undefined,
    openGraph: {
      title: blog.name,
      description: blog.description ?? undefined,
      url,
      type: "website",
      ...(ogImageUrl && { images: [{ url: ogImageUrl, width: 1200, height: 630 }] }),
    },
    alternates: { canonical: url },
  };
}

export default async function HomePage({ searchParams }: HomeProps) {
  const params = await searchParams;
  const blog = await getBlogConfig();
  const page = Math.max(1, Number(params.page) || 1);
  const perPage = blog.siteConfig?.postsPerPage ?? 9;
  const categorySlug = params.category;

  const { posts, totalPages } = await getPosts(page, perPage, categorySlug);

  const blogUrl = blog.domain ? `https://${blog.domain}` : "";
  const isFirstPage = page === 1 && !categorySlug;
  const featuredPost = isFirstPage ? posts[0] : null;
  const gridPosts = isFirstPage ? posts.slice(1) : posts;

  const queryParams: Record<string, string> = {};
  if (categorySlug) queryParams.category = categorySlug;

  return (
    <>
      <JsonLd
        data={organizationSchema({
          name: blog.name,
          url: blogUrl,
          description: blog.description,
          logoUrl: blog.logoUrl,
        })}
      />

      {/* Hero section */}
      <section className="relative overflow-hidden px-4 pb-6 pt-32 sm:px-6 lg:px-8">
        {blog.siteConfig?.heroImageUrl && (
          <>
            <img
              src={blog.siteConfig.heroImageUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-35"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-surface/20 to-surface" />
          </>
        )}
        <div className="relative mx-auto max-w-7xl">
          <div className="animate-fade-in mb-12 text-center">
            <p className="mb-3 text-sm font-medium uppercase tracking-widest text-primary">
              Welcome to
            </p>
            <h1 className="mb-5 text-4xl font-bold text-content md:text-5xl lg:text-6xl">
              {blog.name}
            </h1>
            {blog.description && (
              <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted">
                {blog.description}
              </p>
            )}
          </div>

          {/* Category filter */}
          <div className="animate-fade-in">
            <CategoryFilter
              categories={blog.categories}
              activeSlug={categorySlug}
            />
          </div>
        </div>
      </section>

      {/* Featured post */}
      {featuredPost && (
        <section className="px-4 pt-16 sm:px-6 lg:px-8">
          <div className="animate-fade-in-up mx-auto max-w-7xl">
            <FeaturedPost post={featuredPost} />
          </div>
        </section>
      )}

      {/* Post grid */}
      <section className="px-4 pb-20 pt-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {gridPosts.length > 0 && (
            <div className="section-heading">
              <h2>Latest Articles</h2>
              <p>Explore our most recent stories and insights</p>
            </div>
          )}
          {gridPosts.length > 0 ? (
            <div className="stagger-children grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {gridPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  author={blog.defaultAuthor}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-20 text-center">
              <p className="text-xl font-semibold text-content">No posts found</p>
              <p className="mt-2 text-sm text-muted">
                Check back soon for new content.
              </p>
            </div>
          )}

          <div className="mt-16">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              basePath="/"
              queryParams={queryParams}
            />
          </div>
        </div>
      </section>
    </>
  );
}
