import Link from "next/link";
import type { Blog, Category } from "@autoblog/database";

interface FooterProps {
  blog: Blog;
  categories: Category[];
}

export function Footer({ blog, categories }: FooterProps) {
  return (
    <footer className="border-t border-edge bg-surface-alt/40">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr]">
          {/* Blog info */}
          <div>
            <h3 className="mb-3 text-2xl font-bold text-content">
              {blog.name}
            </h3>
            {blog.description && (
              <p className="max-w-md text-sm leading-relaxed text-muted">
                {blog.description}
              </p>
            )}
          </div>

          {/* Category links */}
          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted">
              Categories
            </h4>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-2.5">
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/category/${cat.slug}`}
                    className="group inline-flex items-center gap-1.5 text-sm text-muted transition-colors duration-200 hover:text-primary"
                  >
                    <span className="inline-block h-1 w-1 rounded-full bg-primary/40 transition-colors group-hover:bg-primary" />
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-edge pt-6 text-center text-xs text-muted/70">
          &copy; {new Date().getFullYear()} {blog.name}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
