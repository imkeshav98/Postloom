"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";

const RUN_TYPES = ["SETUP", "RESEARCH", "GENERATE", "BATCH", "OPTIMIZE"];

interface EnqueueButtonProps {
  blogs: { id: string; name: string }[];
}

export function EnqueueButton({ blogs }: EnqueueButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [blogId, setBlogId] = useState("");
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!blogId || !type) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blogId, type }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Failed to enqueue");
        return;
      }

      setOpen(false);
      setBlogId("");
      setType("");
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          Enqueue Run
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enqueue Pipeline Run</DialogTitle>
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

          <div className="space-y-2">
            <Label>Run Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {RUN_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading || !blogId || !type}>
              {loading ? "Enqueuing..." : "Enqueue"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
