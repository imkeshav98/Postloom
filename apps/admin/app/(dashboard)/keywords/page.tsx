import { prisma } from "@/lib/db";
import { validateSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

export default async function KeywordsPage() {
  const user = await validateSession();
  if (!user) redirect("/login");

  const keywords = await prisma.keyword.findMany({
    take: 100,
    orderBy: { searchVolume: "desc" },
    include: {
      blog: { select: { name: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-content">Keywords</h2>
        <p className="text-sm text-muted-foreground">{keywords.length} keyword{keywords.length !== 1 ? "s" : ""}</p>
      </div>

      {keywords.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No keywords yet. Run a RESEARCH pipeline to discover keywords.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-edge/60 bg-surface-alt text-left dark:border-white/5">
                    <th className="px-4 py-3 font-medium text-muted-foreground">Keyword</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Blog</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground text-right">Volume</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground text-right">Difficulty</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground text-right">CPC</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Intent</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground text-right">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-edge/60 dark:divide-white/5">
                  {keywords.map((kw) => (
                    <tr key={kw.id} className="transition-colors hover:bg-surface-alt">
                      <td className="px-4 py-3 font-medium text-content">{kw.keyword}</td>
                      <td className="px-4 py-3 text-muted-foreground">{kw.blog.name}</td>
                      <td className="px-4 py-3 text-right text-content">
                        {kw.searchVolume?.toLocaleString() ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DifficultyBadge value={kw.difficulty} />
                      </td>
                      <td className="px-4 py-3 text-right text-content">
                        {kw.cpc != null ? `$${kw.cpc.toFixed(2)}` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-xs">
                          {kw.intent ?? "—"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right text-content">
                        {kw.trendScore != null ? `${Math.round(kw.trendScore * 100)}%` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
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
