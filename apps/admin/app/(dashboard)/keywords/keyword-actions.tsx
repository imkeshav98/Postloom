"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, FlaskConical, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface KeywordActionsProps {
  blogs: { id: string; name: string }[];
}

export function KeywordActions({ blogs }: KeywordActionsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  // Research dialog
  const [open, setOpen] = useState(false);
  const [blogId, setBlogId] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (query) {
      params.set("q", query);
    } else {
      params.delete("q");
    }
    params.set("page", "1");
    router.push(`/keywords?${params.toString()}`);
  }

  async function handleResearch() {
    if (!blogId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/keywords/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blogId }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to enqueue research");
        return;
      }
      toast.success("Research pipeline enqueued");
      setOpen(false);
      setBlogId("");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex w-full items-center gap-2 sm:w-auto sm:gap-3">
      <form onSubmit={handleSearch} className="flex min-w-0 flex-1 items-center gap-2 sm:flex-initial">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search keywords..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-8"
          />
        </div>
      </form>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="shrink-0">
            <FlaskConical className="h-4 w-4" />
            <span className="hidden sm:inline">Run Research</span>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Run Keyword Research</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Blog</Label>
              <Select value={blogId} onValueChange={setBlogId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a blog" />
                </SelectTrigger>
                <SelectContent>
                  {blogs.map((blog) => (
                    <SelectItem key={blog.id} value={blog.id}>
                      {blog.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleResearch} disabled={loading || !blogId}>
                {loading ? "Enqueuing..." : "Run Research"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Generate button for unused keywords ────────────────────────────────────

interface GenerateButtonProps {
  keywordId: string;
  blogId: string;
}

export function GenerateButton({ keywordId, blogId }: GenerateButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    try {
      const res = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blogId,
          type: "GENERATE",
          input: { keywordId },
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to enqueue generation");
        return;
      }
      toast.success("Content generation enqueued for this keyword");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleGenerate}
      disabled={loading}
      className="h-7 gap-1 text-xs text-primary hover:text-primary"
    >
      <Sparkles className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">{loading ? "Queuing..." : "Generate"}</span>
    </Button>
  );
}
