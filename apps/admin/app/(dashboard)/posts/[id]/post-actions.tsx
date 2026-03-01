"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { Eye, EyeOff, Pencil, Trash2, Clock } from "lucide-react";

interface PostActionsProps {
  postId: string;
  currentStatus: string;
  scheduledAt?: string | null;
}

export function PostActions({ postId, currentStatus, scheduledAt }: PostActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(scheduledAt ?? "");

  const isPublished = currentStatus === "PUBLISHED";
  const isScheduled = currentStatus === "SCHEDULED";

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

  async function handleSchedule() {
    if (!scheduleDate) return;
    setLoading("schedule");
    try {
      await fetch(`/api/posts/${postId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledAt: scheduleDate }),
      });
      setScheduleOpen(false);
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

      {/* Schedule Dialog */}
      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" disabled={!!loading}>
            <Clock className="h-4 w-4" />
            {isScheduled ? "Reschedule" : "Schedule"}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Publish Date & Time</Label>
              <Input
                type="datetime-local"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setScheduleOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSchedule} disabled={loading === "schedule" || !scheduleDate}>
                {loading === "schedule" ? "Scheduling..." : "Schedule"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
