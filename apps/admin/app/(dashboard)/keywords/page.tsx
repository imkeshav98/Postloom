import Link from "next/link";
import { prisma } from "@/lib/db";
import { validateSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { KeywordActions, GenerateButton } from "./keyword-actions";

export default async function KeywordsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; blogId?: string; q?: string }>;
}) {
  const user = await validateSession();
  if (!user) redirect("/login");

  const sp = await searchParams;
  const page = parseInt(sp.page || "1");
  const limit = 20;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = {};
  if (sp.blogId) where.blogId = sp.blogId;
  if (sp.q) where.keyword = { contains: sp.q, mode: "insensitive" };

  const [keywords, total, blogs] = await Promise.all([
    prisma.keyword.findMany({
      where,
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { searchVolume: "desc" },
      include: {
        blog: { select: { id: true, name: true } },
        contentPlans: {
          select: { id: true, status: true },
          take: 1,
        },
      },
    }),
    prisma.keyword.count({ where }),
    prisma.blog.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const totalPages = Math.ceil(total / limit);

  function filterUrl(overrides: Record<string, string>) {
    const p = new URLSearchParams();
    if (overrides.blogId ?? sp.blogId) p.set("blogId", overrides.blogId ?? sp.blogId!);
    if (sp.q) p.set("q", sp.q);
    if (overrides.page) p.set("page", overrides.page);
    const qs = p.toString();
    return `/keywords${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-content">Keywords</h2>
          <p className="text-sm text-muted-foreground">{total} keyword{total !== 1 ? "s" : ""}</p>
        </div>
        <KeywordActions blogs={blogs} />
      </div>

      {/* Blog filter */}
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={`/keywords${sp.q ? `?q=${sp.q}` : ""}`}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            !sp.blogId
              ? "bg-primary/10 text-primary"
              : "bg-surface-alt text-muted-foreground hover:text-content"
          }`}
        >
          All Blogs
        </Link>
        {blogs.map((b) => (
          <Link
            key={b.id}
            href={filterUrl({ blogId: b.id, page: "1" })}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              sp.blogId === b.id
                ? "bg-primary/10 text-primary"
                : "bg-surface-alt text-muted-foreground hover:text-content"
            }`}
          >
            {b.name}
          </Link>
        ))}
      </div>

      {keywords.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No keywords found.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-edge/60 bg-surface-alt text-left dark:border-white/5">
                    <th className="px-2 py-3 font-medium text-muted-foreground sm:px-4">Keyword</th>
                    <th className="hidden px-4 py-3 font-medium text-muted-foreground md:table-cell">Blog</th>
                    <th className="px-2 py-3 font-medium text-muted-foreground text-right sm:px-4">Vol.</th>
                    <th className="px-2 py-3 font-medium text-muted-foreground text-right sm:px-4">Diff.</th>
                    <th className="hidden px-4 py-3 font-medium text-muted-foreground text-right lg:table-cell">CPC</th>
                    <th className="hidden px-4 py-3 font-medium text-muted-foreground lg:table-cell">Intent</th>
                    <th className="hidden px-4 py-3 font-medium text-muted-foreground text-right lg:table-cell">Trend</th>
                    <th className="hidden px-4 py-3 font-medium text-muted-foreground sm:table-cell">Status</th>
                    <th className="px-1 py-3 font-medium text-muted-foreground sm:px-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-edge/60 dark:divide-white/5">
                  {keywords.map((kw) => {
                    const plan = kw.contentPlans[0];
                    const isUsed = !!plan;
                    return (
                      <tr key={kw.id} className="transition-colors hover:bg-surface-alt">
                        <td className="px-2 py-3 font-medium text-content sm:px-4">{kw.keyword}</td>
                        <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{kw.blog.name}</td>
                        <td className="px-2 py-3 text-right text-content sm:px-4">
                          {kw.searchVolume?.toLocaleString() ?? "—"}
                        </td>
                        <td className="px-2 py-3 text-right sm:px-4">
                          <DifficultyBadge value={kw.difficulty} />
                        </td>
                        <td className="hidden px-4 py-3 text-right text-content lg:table-cell">
                          {kw.cpc != null ? `$${kw.cpc.toFixed(2)}` : "—"}
                        </td>
                        <td className="hidden px-4 py-3 lg:table-cell">
                          <Badge variant="outline" className="text-xs">
                            {kw.intent ?? "—"}
                          </Badge>
                        </td>
                        <td className="hidden px-4 py-3 text-right text-content lg:table-cell">
                          {kw.trendScore != null ? `${Math.round(kw.trendScore * 100)}%` : "—"}
                        </td>
                        <td className="hidden px-4 py-3 sm:table-cell">
                          {isUsed ? (
                            <Badge
                              variant="secondary"
                              className="bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300"
                            >
                              {plan.status === "COMPLETED" ? "Published" : plan.status === "IN_PROGRESS" ? "In Progress" : "Planned"}
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400"
                            >
                              Unused
                            </Badge>
                          )}
                        </td>
                        <td className="px-1 py-3 sm:px-4">
                          {!isUsed && (
                            <GenerateButton keywordId={kw.id} blogId={kw.blog.id} />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={filterUrl({ page: String(p) })}
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

function DifficultyBadge({ value }: { value: number | null }) {
  if (value == null) return <span className="text-muted-foreground">—</span>;

  const color =
    value < 30
      ? "text-green-600 dark:text-green-400"
      : value < 60
        ? "text-yellow-600 dark:text-yellow-400"
        : "text-red-600 dark:text-red-400";

  return <span className={`font-medium ${color}`}>{value}</span>;
}
