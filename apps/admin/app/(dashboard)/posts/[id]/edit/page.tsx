"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

interface PostData {
  id: string;
  title: string;
  slug: string;
  contentMarkdown: string;
  excerpt: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  status: string;
  categoryId: string | null;
  blogId: string;
  blog: { id: string; name: string; domain: string | null };
  category: { id: string; name: string } | null;
}

interface Category {
  id: string;
  name: string;
}

const STATUSES = ["DRAFT", "REVIEWING", "SCHEDULED", "PUBLISHED", "ARCHIVED"];

export default function PostEditPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  // Detect dark mode from data-theme attribute
  const [colorMode, setColorMode] = useState<"light" | "dark">("light");
  useEffect(() => {
    const el = document.documentElement;
    setColorMode(el.getAttribute("data-theme") === "dark" ? "dark" : "light");
    const observer = new MutationObserver(() => {
      setColorMode(el.getAttribute("data-theme") === "dark" ? "dark" : "light");
    });
    observer.observe(el, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  // Post fields
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [contentMarkdown, setContentMarkdown] = useState("");

  useEffect(() => {
    fetch(`/api/posts/${id}`)
      .then((res) => res.json())
      .then(async (post: PostData) => {
        setTitle(post.title);
        setSlug(post.slug);
        setExcerpt(post.excerpt ?? "");
        setMetaTitle(post.metaTitle ?? "");
        setMetaDescription(post.metaDescription ?? "");
        setStatus(post.status);
        setCategoryId(post.categoryId);
        setContentMarkdown(post.contentMarkdown ?? "");

        // Fetch categories for dropdown
        const blogRes = await fetch(`/api/blogs/${post.blogId ?? post.blog.id}`);
        const blogData = await blogRes.json();
        setCategories(blogData.categories ?? []);
        setLoading(false);
      });
  }, [id]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          excerpt: excerpt || null,
          metaTitle: metaTitle || null,
          metaDescription: metaDescription || null,
          status,
          categoryId: categoryId || null,
          contentMarkdown,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to save");
        return;
      }

      toast.success("Post updated");
      router.push(`/posts/${id}`);
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Link
        href={`/posts/${id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-content"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Post
      </Link>

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-content">Edit Post</h2>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Post Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={categoryId ?? "none"} onValueChange={(v) => setCategoryId(v === "none" ? null : v)}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="excerpt">Excerpt</Label>
            <Textarea id="excerpt" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="metaTitle">Meta Title</Label>
              <Input id="metaTitle" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="metaDescription">Meta Description</Label>
              <Input id="metaDescription" value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Markdown Editor */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Content</CardTitle>
        </CardHeader>
        <CardContent>
          <div data-color-mode={colorMode}>
            <MDEditor
              value={contentMarkdown}
              onChange={(val) => setContentMarkdown(val ?? "")}
              height={500}
              preview="edit"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
