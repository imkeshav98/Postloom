import Link from "next/link";
import Image from "next/image";
import type { Post, Category, Image as DbImage } from "@autoblog/database";

interface FeaturedPostProps {
  post: Post & {
    category: Category | null;
    images: DbImage[];
  };
}

export function FeaturedPost({ post }: FeaturedPostProps) {
  const thumbnail = post.images[0];
  const date = post.publishedAt
    ? new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(new Date(post.publishedAt))
    : null;

  return (
    <Link href={`/${post.slug}`} className="group block">
      <div className="overflow-hidden rounded-3xl shadow-lg shadow-primary/8 transition-shadow duration-300 hover:shadow-xl hover:shadow-primary/12">
        <div className="grid md:grid-cols-[1fr_1.2fr]">
          {/* Text panel */}
          <div className="flex flex-col justify-center bg-primary-fill px-8 py-10 md:px-12 md:py-16">
            {post.category && (
              <span className="mb-4 inline-block w-fit rounded-full border border-white/30 px-3 py-1 text-xs font-medium uppercase tracking-widest text-white/80">
                {post.category.name}
              </span>
            )}
            <h2 className="mb-4 text-2xl font-bold leading-tight text-white md:text-3xl lg:text-[2.75rem] lg:leading-[1.15]">
              {post.title}
            </h2>
            {post.excerpt && (
              <p className="mb-6 line-clamp-3 text-sm leading-relaxed text-white/70">
                {post.excerpt}
              </p>
            )}
            <div className="flex items-center gap-4">
              {date && (
                <time className="text-xs text-white/50">{date}</time>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 px-4 py-2 text-sm font-medium text-white/90 transition-all duration-300 group-hover:gap-2.5 group-hover:border-white/50">
                Read article
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </span>
            </div>
          </div>

          {/* Image side */}
          <div className="relative aspect-[16/10] md:aspect-auto md:min-h-[380px]">
            {thumbnail ? (
              <Image
                src={thumbnail.url}
                alt={thumbnail.altText}
                fill
                sizes="(max-width: 768px) 100vw, 55vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                priority
              />
            ) : (
              <div className="flex h-full min-h-48 items-center justify-center bg-hero text-muted/30">
                <svg
                  width="64"
                  height="64"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
