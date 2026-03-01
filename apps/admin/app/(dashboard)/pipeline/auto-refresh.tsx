"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Polls router.refresh() every `interval` ms while `active` is true. */
export function AutoRefresh({
  active,
  interval = 3000,
}: {
  active: boolean;
  interval?: number;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => router.refresh(), interval);
    return () => clearInterval(id);
  }, [active, interval, router]);

  return null;
}
