import Link from "next/link";
import type { Blog, Category } from "@autoblog/database";

interface FooterProps {
  blog: Blog;
  categories: Category[];
}

export function Footer({ blog, categories }: FooterProps) {
  return (
    <footer className="border-t border-edge/60 bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.2fr_2fr_1fr]">
          {/* Blog info */}
          <div>
            <div className="mb-4 flex items-center gap-2.5">
              {blog.logoUrl ? (
                <img
                  src={blog.logoUrl}
                  alt={blog.name}
                  className="h-8 w-8 rounded-xl object-cover"
                />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-fill text-xs font-bold text-white">
                  {blog.name.charAt(0)}
                </span>
              )}
              <h3 className="text-2xl font-bold text-content">
                {blog.name}
              </h3>
            </div>
            {blog.description && (
              <p className="max-w-xs text-sm leading-relaxed text-muted">
                {blog.description}
              </p>
            )}
          </div>

          {/* Category links — 2 columns */}
          <div>
            <h4 className="mb-5 text-xs font-semibold uppercase tracking-widest text-muted">
              Categories
            </h4>
            <ul className="grid grid-cols-2 gap-x-8 gap-y-3">
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/category/${cat.slug}`}
                    className="group inline-flex items-center gap-1.5 text-sm text-muted transition-colors duration-200 hover:text-primary"
                  >
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary/30 transition-colors group-hover:bg-primary" />
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Page links */}
          <div>
            <h4 className="mb-5 text-xs font-semibold uppercase tracking-widest text-muted">
              Information
            </h4>
            <ul className="space-y-3">
              {[
                { slug: "about", label: "About" },
                { slug: "contact", label: "Contact" },
                { slug: "privacy-policy", label: "Privacy Policy" },
                { slug: "terms-of-service", label: "Terms of Service" },
                { slug: "disclaimer", label: "Disclaimer" },
              ].map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/info/${p.slug}`}
                    className="text-sm text-muted transition-colors duration-200 hover:text-primary"
                  >
                    {p.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-edge/60 pt-8 text-center text-xs text-muted/60">
          &copy; {new Date().getFullYear()} {blog.name}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
