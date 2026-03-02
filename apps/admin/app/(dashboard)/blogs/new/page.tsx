"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Check } from "lucide-react";
import Link from "next/link";

const PALETTES = [
  { value: "default", label: "Indigo", primary: "#4f46e5", accent: "#7c3aed" },
  { value: "coral", label: "Coral", primary: "#ea580c", accent: "#dc2626" },
  { value: "emerald", label: "Emerald", primary: "#059669", accent: "#0284c7" },
  { value: "teal", label: "Teal", primary: "#0f766e", accent: "#b45309" },
] as const;

export default function NewBlogPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [palette, setPalette] = useState("default");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const data = {
      name: form.get("name"),
      slug: form.get("slug"),
      niche: form.get("niche"),
      description: form.get("description"),
      domain: form.get("domain"),
      language: form.get("language") || "en",
      siteConfig: { palette },
    };

    try {
      const res = await fetch("/api/blogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Failed to create blog");
        return;
      }

      const blog = await res.json();
      router.push(`/blogs/${blog.id}`);
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/blogs"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-content"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Blogs
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Create New Blog</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Blog Name</Label>
                <Input id="name" name="name" placeholder="My Awesome Blog" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" name="slug" placeholder="my-awesome-blog" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="niche">Niche</Label>
                <Input id="niche" name="niche" placeholder="technology" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Input id="language" name="language" placeholder="en" defaultValue="en" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="domain">Domain (optional)</Label>
              <Input id="domain" name="domain" placeholder="myblog.com" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="A brief description of your blog..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Color Palette</Label>
              <div className="grid grid-cols-4 gap-3">
                {PALETTES.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPalette(p.value)}
                    className={`relative flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all ${
                      palette === p.value
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-edge hover:border-muted-foreground/40"
                    }`}
                  >
                    {palette === p.value && (
                      <div className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                        <Check className="h-2.5 w-2.5 text-white" />
                      </div>
                    )}
                    <div className="flex gap-1.5">
                      <span className="h-6 w-6 rounded-full border border-black/10" style={{ background: p.primary }} />
                      <span className="h-6 w-6 rounded-full border border-black/10" style={{ background: p.accent }} />
                    </div>
                    <span className="text-xs font-medium text-content">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Blog"}
              </Button>
              <Link href="/blogs">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
