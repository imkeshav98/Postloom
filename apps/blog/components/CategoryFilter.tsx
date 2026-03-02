"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Category } from "@postloom/database";

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
    <div className="mx-auto flex max-w-4xl flex-wrap justify-center gap-2 overflow-hidden">
      <button
        onClick={() => handleClick()}
        className={`rounded-full px-5 py-2 text-sm font-medium transition-all duration-200 ${
          !activeSlug
            ? "bg-primary-fill text-white"
            : "border border-edge text-muted hover:border-accent hover:text-accent"
        }`}
      >
        All
      </button>

      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => handleClick(cat.slug)}
          className={`rounded-full px-5 py-2 text-sm font-medium transition-all duration-200 ${
            activeSlug === cat.slug
              ? "bg-primary-fill text-white"
              : "border border-edge text-muted hover:border-accent hover:text-accent"
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
