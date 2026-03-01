"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Pencil, Trash2 } from "lucide-react";

interface PostActionsProps {
  postId: string;
  currentStatus: string;
}

export function PostActions({ postId, currentStatus }: PostActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState("");

  const isPublished = currentStatus === "PUBLISHED";

  async function handleTogglePublish() {
    setLoading("publish");
    try {
      await fetch(`/api/posts/${postId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publish: !isPublished }),
      });
      router.refresh();
    } finally {
      setLoading("");
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this post?")) return;
    setLoading("delete");
    try {
      await fetch(`/api/posts/${postId}`, { method: "DELETE" });
      router.push("/posts");
      router.refresh();
    } finally {
      setLoading("");
    }
  }

  return (
    <div className="flex gap-2">
      <Link href={`/posts/${postId}/edit`}>
        <Button variant="outline">
          <Pencil className="h-4 w-4" />
          Edit
        </Button>
      </Link>
      <Button
        variant={isPublished ? "outline" : "default"}
        onClick={handleTogglePublish}
        disabled={!!loading}
      >
        {isPublished ? (
          <>
            <EyeOff className="h-4 w-4" />
            {loading === "publish" ? "Unpublishing..." : "Unpublish"}
          </>
        ) : (
          <>
            <Eye className="h-4 w-4" />
            {loading === "publish" ? "Publishing..." : "Publish"}
          </>
        )}
      </Button>
      <Button
        variant="destructive"
        onClick={handleDelete}
        disabled={!!loading}
      >
        <Trash2 className="h-4 w-4" />
        {loading === "delete" ? "Deleting..." : "Delete"}
      </Button>
    </div>
  );
}
