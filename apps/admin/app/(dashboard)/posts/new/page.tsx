"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

interface Blog {
  id: string;
  name: string;
  categories?: { id: string; name: string }[];
}

const STATUSES = ["DRAFT", "REVIEWING", "SCHEDULED", "PUBLISHED", "ARCHIVED"];

export default function NewPostPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Detect dark mode
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

  // Form fields
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [blogId, setBlogId] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [status, setStatus] = useState("DRAFT");
  const [excerpt, setExcerpt] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [contentMarkdown, setContentMarkdown] = useState("");

  // Fetch blogs on mount
  useEffect(() => {
    fetch("/api/blogs")
      .then((res) => res.json())
      .then((data) => {
        setBlogs(data);
        setLoading(false);
      });
  }, []);

  // Fetch categories when blog changes
  useEffect(() => {
    if (!blogId) {
      setCategories([]);
      setCategoryId(null);
      return;
    }
    fetch(`/api/blogs/${blogId}`)
      .then((res) => res.json())
      .then((data) => {
        setCategories(data.categories ?? []);
        setCategoryId(null);
      });
  }, [blogId]);

  // Auto-generate slug from title
  useEffect(() => {
    setSlug(
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
    );
  }, [title]);

  async function handleSave() {
    if (!title || !blogId) {
      toast.error("Title and blog are required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          blogId,
          categoryId: categoryId || null,
          status,
          excerpt: excerpt || null,
          metaTitle: metaTitle || null,
          metaDescription: metaDescription || null,
          contentMarkdown,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to create post");
        return;
      }

      const post = await res.json();
      toast.success("Post created");
      router.push(`/posts/${post.id}`);
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
        href="/posts"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-content"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Posts
      </Link>

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-content">New Post</h2>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4" />
          {saving ? "Creating..." : "Create Post"}
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
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter post title" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="blog">Blog</Label>
              <Select value={blogId} onValueChange={setBlogId}>
                <SelectTrigger id="blog">
                  <SelectValue placeholder="Select blog" />
                </SelectTrigger>
                <SelectContent>
                  {blogs.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
            <Textarea id="excerpt" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2} placeholder="Brief summary of the post" />
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
