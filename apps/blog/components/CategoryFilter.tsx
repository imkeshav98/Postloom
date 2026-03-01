"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Category } from "@autoblog/database";

interface CategoryFilterProps {
  categories: Category[];
  activeSlug?: string;
}

export function CategoryFilter({ categories, activeSlug }: CategoryFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleClick(slug?: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    if (slug) {
      params.set("category", slug);
    } else {
      params.delete("category");
    }
    router.push(`/?${params.toString()}`);
  }

  return (
    <div className="rounded-xl bg-primary-fill px-2 py-2">
      <div className="flex gap-1 overflow-x-auto scrollbar-none">
        <button
          onClick={() => handleClick()}
          className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
            !activeSlug
              ? "bg-white/15 text-white"
              : "text-white/60 hover:text-white/90"
          }`}
        >
          All
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleClick(cat.slug)}
            className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
              activeSlug === cat.slug
                ? "bg-white/15 text-white"
                : "text-white/60 hover:text-white/90"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
}
