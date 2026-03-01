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
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, FileText, Workflow, Tag, ExternalLink, ImageIcon, Pencil } from "lucide-react";

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await validateSession();
  if (!user) redirect("/login");

  const { id } = await params;
  const blog = await prisma.blog.findUnique({
    where: { id },
    include: {
      siteConfig: true,
      categories: { orderBy: { name: "asc" } },
      _count: { select: { posts: true, keywords: true, pipelineRuns: true } },
    },
  });

  if (!blog) notFound();

  const recentPosts = await prisma.post.findMany({
    where: { blogId: id },
    take: 5,
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, status: true, createdAt: true },
  });

  const recentRuns = await prisma.pipelineRun.findMany({
    where: { blogId: id },
    take: 5,
    orderBy: { createdAt: "desc" },
    select: { id: true, type: true, status: true, createdAt: true },
  });

  return (
    <div className="space-y-6">
      <Link
        href="/blogs"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-content"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Blogs
      </Link>

      {/* Blog header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-content">{blog.name}</h2>
          <p className="text-sm text-muted-foreground">
            /{blog.slug} {blog.domain && `· ${blog.domain}`}
          </p>
          {blog.description && (
            <p className="mt-1 text-sm text-muted-foreground">{blog.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary">{blog.niche}</Badge>
          <Link href={`/blogs/${id}/edit`}>
            <Button variant="outline" size="sm">
              <Pencil className="h-3 w-3" />
              Edit
            </Button>
          </Link>
          {blog.domain && (
            <a href={`https://${blog.domain}`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                <ExternalLink className="h-3 w-3" />
                Visit
              </Button>
            </a>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">{blog._count.posts}</p>
              <p className="text-xs text-muted-foreground">Posts</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <Tag className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">{blog._count.keywords}</p>
              <p className="text-xs text-muted-foreground">Keywords</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <Workflow className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">{blog._count.pipelineRuns}</p>
              <p className="text-xs text-muted-foreground">Pipeline Runs</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            {blog.categories.length === 0 ? (
              <p className="text-sm text-muted-foreground">No categories yet. Run SETUP pipeline to generate them.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {blog.categories.map((cat) => (
                  <Badge key={cat.id} variant="outline">
                    {cat.name}
                    {cat.isPillar && " (Pillar)"}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent posts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Posts</CardTitle>
          </CardHeader>
          <CardContent>
            {recentPosts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No posts yet.</p>
            ) : (
              <div className="space-y-2">
                {recentPosts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/posts/${post.id}`}
                    className="flex items-center justify-between rounded-md p-2 transition-colors hover:bg-surface-alt"
                  >
                    <p className="truncate text-sm text-content">{post.title}</p>
                    <Badge variant="secondary" className="shrink-0 text-xs">
                      {post.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Site Images */}
      {(() => {
        const images = [
          { label: "Logo", url: blog.logoUrl },
          { label: "Favicon", url: blog.siteConfig?.faviconUrl },
          { label: "OG Image", url: blog.siteConfig?.ogImageUrl },
          { label: "Hero Image", url: blog.siteConfig?.heroImageUrl },
        ].filter((img) => img.url);
        if (images.length === 0) return null;
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                <span className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Site Images
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {images.map((img) => (
                  <div key={img.label} className="overflow-hidden rounded-lg border border-edge/60 dark:border-white/[0.06]">
                    <div className="relative aspect-video bg-surface-alt">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url!}
                        alt={img.label}
                        className="absolute inset-0 h-full w-full object-contain"
                      />
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-medium text-content">{img.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Recent pipeline runs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Pipeline Runs</CardTitle>
        </CardHeader>
        <CardContent>
          {recentRuns.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pipeline runs yet.</p>
          ) : (
            <div className="space-y-2">
              {recentRuns.map((run) => (
                <Link
                  key={run.id}
                  href={`/pipeline/${run.id}`}
                  className="flex items-center justify-between rounded-md p-2 transition-colors hover:bg-surface-alt"
                >
                  <span className="text-sm text-content">{run.type}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {run.createdAt.toLocaleDateString()}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {run.status}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
