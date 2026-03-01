"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Save } from "lucide-react";
import { toast } from "sonner";

const STATUSES = ["PLANNED", "IN_PROGRESS", "COMPLETED", "SKIPPED"];

interface PlanActionsProps {
  planId: string;
  currentStatus: string;
  currentPriority: number;
}

export function PlanActions({ planId, currentStatus, currentPriority }: PlanActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [status, setStatus] = useState(currentStatus);
  const [priority, setPriority] = useState(String(currentPriority));

  async function handleUpdate() {
    setLoading("update");
    try {
      const res = await fetch(`/api/content-plans/${planId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, priority: parseInt(priority) || 0 }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to update");
        return;
      }
      toast.success("Plan updated");
      router.refresh();
    } finally {
      setLoading("");
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this content plan?")) return;
    setLoading("delete");
    try {
      await fetch(`/api/content-plans/${planId}`, { method: "DELETE" });
      router.push("/content-plans");
      router.refresh();
    } finally {
      setLoading("");
    }
  }

  return (
    <div className="flex items-end gap-3">
      <div className="space-y-1">
        <Label className="text-xs">Status</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s.replace("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Priority</Label>
        <Input
          type="number"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="w-20"
        />
      </div>
      <Button onClick={handleUpdate} disabled={!!loading}>
        <Save className="h-4 w-4" />
        {loading === "update" ? "Saving..." : "Save"}
      </Button>
      <Button variant="destructive" onClick={handleDelete} disabled={!!loading}>
        <Trash2 className="h-4 w-4" />
        {loading === "delete" ? "Deleting..." : "Delete"}
      </Button>
    </div>
  );
}
