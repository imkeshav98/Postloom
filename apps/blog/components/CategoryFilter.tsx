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
    <div className="flex flex-wrap justify-center gap-2">
      <button
        onClick={() => handleClick()}
        className={`shrink-0 rounded-full px-5 py-2 text-sm font-medium transition-all duration-200 ${
          !activeSlug
            ? "bg-primary-fill text-white"
            : "border border-edge text-muted hover:border-primary hover:text-primary"
        }`}
      >
        All
      </button>

      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => handleClick(cat.slug)}
          className={`shrink-0 rounded-full px-5 py-2 text-sm font-medium transition-all duration-200 ${
            activeSlug === cat.slug
              ? "bg-primary-fill text-white"
              : "border border-edge text-muted hover:border-primary hover:text-primary"
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
