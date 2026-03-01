import { prisma } from "@/lib/db";
import { validateSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings as SettingsIcon } from "lucide-react";

export default async function SettingsPage() {
  const user = await validateSession();
  if (!user) redirect("/login");

  const blogs = await prisma.blog.findMany({
    orderBy: { name: "asc" },
    include: {
      siteConfig: true,
      _count: { select: { categories: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-content">Settings</h2>
        <p className="text-sm text-muted-foreground">Manage blog configurations</p>
      </div>

      {blogs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <SettingsIcon className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No blogs to configure.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {blogs.map((blog) => (
            <Card key={blog.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{blog.name}</CardTitle>
                  <Badge variant="secondary">{blog.niche}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                  <InfoItem
                    label="Palette"
                    value={blog.siteConfig?.palette ?? "default"}
                  />
                  <InfoItem
                    label="Posts/Page"
                    value={String(blog.siteConfig?.postsPerPage ?? 10)}
                  />
                  <InfoItem
                    label="Categories"
                    value={String(blog._count.categories)}
                  />
                  <InfoItem
                    label="Language"
                    value={blog.language}
                  />
                  <InfoItem
                    label="Author"
                    value={blog.defaultAuthor}
                  />
                  <InfoItem
                    label="Domain"
                    value={blog.domain ?? "Not set"}
                  />
                  <InfoItem
                    label="AdSense"
                    value={blog.adsenseId ?? "Not set"}
                  />
                  <InfoItem
                    label="Analytics"
                    value={blog.siteConfig?.googleAnalyticsId ?? "Not set"}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium text-content">{value}</p>
    </div>
  );
}
