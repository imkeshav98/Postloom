import Link from "next/link";
import { prisma } from "@/lib/db";
import { validateSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Plus } from "lucide-react";

const statusColors: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300",
  PUBLISHED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
  ARCHIVED: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
};

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; blogId?: string }>;
}) {
  const user = await validateSession();
  if (!user) redirect("/login");

  const sp = await searchParams;
  const page = parseInt(sp.page || "1");
  const limit = 20;

  const where: Record<string, unknown> = {};
  if (sp.status) where.status = sp.status;
  if (sp.blogId) where.blogId = sp.blogId;

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { createdAt: "desc" },
      include: {
        blog: { select: { name: true } },
        category: { select: { name: true } },
      },
    }),
    prisma.post.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-between sm:block">
          <div>
            <h2 className="text-xl font-bold text-content">All Posts</h2>
            <p className="text-sm text-muted-foreground">{total} post{total !== 1 ? "s" : ""}</p>
          </div>
          <Link href="/posts/new" className="sm:hidden">
            <Button size="sm">
              <Plus className="h-4 w-4" />
              New Post
            </Button>
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/posts/new" className="hidden sm:inline-flex">
            <Button size="sm">
              <Plus className="h-4 w-4" />
              New Post
            </Button>
          </Link>
          {["", "DRAFT", "PUBLISHED", "ARCHIVED"].map((s) => (
            <Link
              key={s}
              href={`/posts${s ? `?status=${s}` : ""}`}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                (sp.status || "") === s
                  ? "bg-primary/10 text-primary"
                  : "bg-surface-alt text-muted-foreground hover:text-content"
              }`}
            >
              {s || "All"}
            </Link>
          ))}
        </div>
      </div>

      {posts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No posts found.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-edge/60 dark:divide-white/5">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/posts/${post.id}`}
                  className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-surface-alt"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-content">
                      {post.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {post.blog.name}
                      {post.category && ` · ${post.category.name}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 pl-4">
                    <Badge
                      variant="secondary"
                      className={statusColors[post.status] ?? ""}
                    >
                      {post.status}
                    </Badge>
                    <span className="hidden whitespace-nowrap text-xs text-muted-foreground sm:block">
                      {post.createdAt.toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/posts?page=${p}${sp.status ? `&status=${sp.status}` : ""}`}
              className={`flex h-8 w-8 items-center justify-center rounded-md text-xs ${
                p === page
                  ? "bg-primary/10 text-primary"
                  : "bg-surface-alt text-muted-foreground hover:text-content"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
