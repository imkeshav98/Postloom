"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, Trash2, Link2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AffiliateLink {
  id: string;
  url: string;
  anchorText: string;
  platform: string;
}

interface AffiliateLinksSectionProps {
  postId: string;
}

export function AffiliateLinksSection({ postId }: AffiliateLinksSectionProps) {
  const router = useRouter();
  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState("");

  // Form
  const [showForm, setShowForm] = useState(false);
  const [url, setUrl] = useState("");
  const [anchorText, setAnchorText] = useState("");
  const [platform, setPlatform] = useState("");

  useEffect(() => {
    fetch(`/api/posts/${postId}/affiliates`)
      .then((res) => res.json())
      .then((data) => {
        setLinks(data);
        setLoading(false);
      });
  }, [postId]);

  async function handleAdd() {
    if (!url || !anchorText || !platform) {
      toast.error("All fields are required");
      return;
    }
    setAdding(true);
    try {
      const res = await fetch(`/api/posts/${postId}/affiliates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, anchorText, platform }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to add");
        return;
      }
      const link = await res.json();
      setLinks((prev) => [link, ...prev]);
      setUrl("");
      setAnchorText("");
      setPlatform("");
      setShowForm(false);
      toast.success("Affiliate link added");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      await fetch(`/api/posts/${postId}/affiliates/${id}`, { method: "DELETE" });
      setLinks((prev) => prev.filter((l) => l.id !== id));
      toast.success("Affiliate link removed");
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleting("");
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            <span className="flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Affiliate Links ({links.length})
            </span>
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showForm && (
          <div className="mb-4 space-y-3 rounded-lg border border-edge/60 p-3 dark:border-white/[0.06]">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">URL</Label>
                <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Anchor Text</Label>
                <Input value={anchorText} onChange={(e) => setAnchorText(e.target.value)} placeholder="Click here" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Platform</Label>
                <Input value={platform} onChange={(e) => setPlatform(e.target.value)} placeholder="Amazon, ShareASale..." />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button size="sm" onClick={handleAdd} disabled={adding}>
                {adding ? "Adding..." : "Add Link"}
              </Button>
            </div>
          </div>
        )}

        {links.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-4">No affiliate links yet.</p>
        ) : (
          <div className="divide-y divide-edge/60 dark:divide-white/5">
            {links.map((link) => (
              <div key={link.id} className="flex items-center justify-between py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-content">{link.anchorText}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {link.platform} · {link.url}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(link.id)}
                  disabled={deleting === link.id}
                  className="ml-2 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
