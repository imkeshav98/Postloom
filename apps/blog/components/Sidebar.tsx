import Link from "next/link";
import Image from "next/image";
import type { Post, Category, Image as DbImage } from "@postloom/database";

interface SidebarProps {
  relatedPosts: (Post & { category: Category | null; images: DbImage[] })[];
  author: string;
  adsenseSlot?: string | null;
}

export function Sidebar({ relatedPosts, author, adsenseSlot }: SidebarProps) {
  return (
    <aside className="space-y-6 lg:sticky lg:top-24">
      {/* AdSense slot */}
      {adsenseSlot && (
        <div
          className="overflow-hidden rounded-xl bg-surface-alt/50 p-4"
          dangerouslySetInnerHTML={{ __html: adsenseSlot }}
        />
      )}

      {/* Related posts */}
      {relatedPosts.length > 0 && (
        <div>
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-primary/60">
            Related Articles
          </h3>
          <div className="space-y-4">
            {relatedPosts.map((post) => {
              const thumb = post.images[0];
              return (
                <Link
                  key={post.id}
                  href={`/${post.slug}`}
                  className="group flex gap-3"
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-hero">
                    {thumb ? (
                      <Image
                        src={thumb.url}
                        alt={thumb.altText}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted/30">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-medium leading-snug text-content transition-colors group-hover:text-accent">
                      {post.title}
                    </p>
                    <p className="mt-1 text-xs text-muted">{author}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}
