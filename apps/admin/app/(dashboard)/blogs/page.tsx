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
import { Plus, Globe, FileText, Workflow } from "lucide-react";

export default async function BlogsPage() {
  const user = await validateSession();
  if (!user) redirect("/login");

  const blogs = await prisma.blog.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { posts: true, pipelineRuns: true, categories: true } },
      siteConfig: { select: { palette: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-content">All Blogs</h2>
          <p className="text-sm text-muted-foreground">{blogs.length} blog{blogs.length !== 1 ? "s" : ""}</p>
        </div>
        <Link href="/blogs/new">
          <Button>
            <Plus className="h-4 w-4" />
            Create Blog
          </Button>
        </Link>
      </div>

      {blogs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Globe className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No blogs yet. Create your first blog to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {blogs.map((blog) => (
            <Link key={blog.id} href={`/blogs/${blog.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-content">{blog.name}</h3>
                      <p className="text-xs text-muted-foreground">/{blog.slug}</p>
                    </div>
                    <Badge variant="secondary">{blog.niche}</Badge>
                  </div>
                  {blog.description && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">{blog.description}</p>
                  )}
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {blog._count.posts} posts
                    </span>
                    <span className="flex items-center gap-1">
                      <Workflow className="h-3 w-3" />
                      {blog._count.pipelineRuns} runs
                    </span>
                  </div>
                  {blog.domain && (
                    <p className="text-xs text-primary">{blog.domain}</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
