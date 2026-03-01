import Link from "next/link";
import Image from "next/image";
import type { Post, Category, Image as DbImage } from "@autoblog/database";

interface PostCardProps {
  post: Post & {
    category: Category | null;
    images: DbImage[];
  };
  author: string;
}

export function PostCard({ post, author }: PostCardProps) {
  const thumbnail = post.images[0];
  const date = post.publishedAt
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(post.publishedAt))
    : null;

  return (
    <article className="group overflow-hidden rounded-2xl border border-edge/60 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5">
      <Link href={`/${post.slug}`} className="block">
        {/* Thumbnail */}
        <div className="relative aspect-[16/10] overflow-hidden bg-hero">
          {thumbnail ? (
            <Image
              src={thumbnail.url}
              alt={thumbnail.altText}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted/30">
              <svg
                width="48"
                height="48"
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

        {/* Card body */}
        <div className="p-5">
          {/* Category + Date row */}
          <div className="mb-2.5 flex items-center justify-between text-xs">
            {post.category ? (
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-medium text-primary">
                {post.category.name}
              </span>
            ) : (
              <span />
            )}
            {date && <time className="text-muted">{date}</time>}
          </div>

          {/* Title */}
          <h3 className="mb-3 line-clamp-2 text-lg font-semibold leading-snug text-content transition-colors duration-200 group-hover:text-primary">
            {post.title}
          </h3>

          {/* Author */}
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-fill text-[10px] font-bold text-white">
              {author.charAt(0)}
            </div>
            <span className="text-xs text-muted">{author}</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
