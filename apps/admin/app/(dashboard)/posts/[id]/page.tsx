import { prisma } from "@/lib/db";
import { validateSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ExternalLink, ImageIcon } from "lucide-react";
import { PostActions } from "./post-actions";
import { AffiliateLinksSection } from "./affiliate-links";

const statusColors: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300",
  PUBLISHED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
  SCHEDULED: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300",
  ARCHIVED: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
};

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await validateSession();
  if (!user) redirect("/login");

  const { id } = await params;
  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      blog: { select: { name: true, domain: true, slug: true, defaultAuthor: true } },
      category: { select: { name: true } },
      tags: true,
      images: true,
    },
  });

  if (!post) notFound();

  const viewUrl = post.blog.domain
    ? `https://${post.blog.domain}/${post.slug}`
    : null;

  return (
    <div className="space-y-6">
      <Link
        href="/posts"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-content"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Posts
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h2 className="text-2xl font-bold text-content">{post.title}</h2>
          <p className="text-sm text-muted-foreground">
            {post.blog.name}
            {post.category && ` · ${post.category.name}`}
            {` · /${post.slug}`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge
            variant="secondary"
            className={statusColors[post.status] ?? ""}
          >
            {post.status}
          </Badge>
          {viewUrl && (
            <a href={viewUrl} target="_blank" rel="noopener noreferrer">
              <Badge variant="outline" className="cursor-pointer gap-1">
                <ExternalLink className="h-3 w-3" />
                View
              </Badge>
            </a>
          )}
        </div>
      </div>

      {/* Actions */}
      <PostActions postId={post.id} currentStatus={post.status} scheduledAt={post.scheduledAt?.toISOString().slice(0, 16) ?? null} />

      {/* Metadata */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Post Info</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <Field label="Author" value={post.blog.defaultAuthor} />
              <Field label="Word Count" value={post.wordCount?.toString() ?? "N/A"} />
              <Field label="Reading Time" value={post.readingTime ? `${post.readingTime} min` : "N/A"} />
              <Field label="Created" value={post.createdAt.toLocaleString()} />
              {post.publishedAt && (
                <Field label="Published" value={post.publishedAt.toLocaleString()} />
              )}
              {post.scheduledAt && (
                <Field label="Scheduled For" value={post.scheduledAt.toLocaleString()} />
              )}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">SEO</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <Field label="Meta Title" value={post.metaTitle ?? "Not set"} />
              <div>
                <dt className="text-xs text-muted-foreground">Meta Description</dt>
                <dd className="mt-0.5 text-content">
                  {post.metaDescription ?? "Not set"}
                </dd>
              </div>
              {post.tags.length > 0 && (
                <div>
                  <dt className="text-xs text-muted-foreground">Tags</dt>
                  <dd className="mt-1 flex flex-wrap gap-1">
                    {post.tags.map((tag) => (
                      <Badge key={tag.id} variant="outline" className="text-xs">
                        {tag.name}
                      </Badge>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      </div>

      {/* Excerpt & Images */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {post.excerpt && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Excerpt</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{post.excerpt}</p>
            </CardContent>
          </Card>
        )}

        {post.images.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                <span className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Images ({post.images.length})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-80 overflow-auto grid grid-cols-2 gap-3">
                {post.images.map((img) => (
                  <div key={img.id} className="overflow-hidden rounded-lg border border-edge/60 dark:border-white/[0.06]">
                    <div className="relative aspect-video bg-surface-alt">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt={img.altText}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    </div>
                    <div className="space-y-1 p-2">
                      <p className="text-xs font-medium text-content line-clamp-1">{img.altText}</p>
                      {img.width && img.height && (
                        <p className="text-xs text-muted-foreground">
                          {img.width} × {img.height} · {img.format.toUpperCase()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Affiliate Links */}
      <AffiliateLinksSection postId={post.id} />

      {/* Content preview */}
      {post.contentMarkdown && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Content</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[32rem] overflow-auto rounded-lg bg-surface-alt p-5">
              <pre className="whitespace-pre-wrap text-sm leading-relaxed text-content">
                {post.contentMarkdown}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-content">{value}</dd>
    </div>
  );
}
