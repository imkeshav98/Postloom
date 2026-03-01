import Link from "next/link";

interface PostNavProps {
  prev: { title: string; slug: string } | null;
  next: { title: string; slug: string } | null;
}

export function PostNav({ prev, next }: PostNavProps) {
  if (!prev && !next) return null;

  return (
    <nav className="mt-12 grid gap-4 sm:grid-cols-2">
      {prev ? (
        <Link
          href={`/${prev.slug}`}
          className="group flex items-center gap-4 rounded-2xl bg-primary/8 p-5 transition-all duration-200 hover:bg-primary/15"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0 text-primary/50 transition-transform duration-200 group-hover:-translate-x-0.5 group-hover:text-primary"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <div className="min-w-0">
            <p className="text-xs font-medium text-primary/50">Previous</p>
            <p className="line-clamp-1 text-sm font-medium text-primary transition-colors group-hover:text-primary/80">
              {prev.title}
            </p>
          </div>
        </Link>
      ) : (
        <div />
      )}

      {next ? (
        <Link
          href={`/${next.slug}`}
          className="group flex items-center justify-end gap-4 rounded-2xl bg-accent/8 p-5 text-right transition-all duration-200 hover:bg-accent/15"
        >
          <div className="min-w-0">
            <p className="text-xs font-medium text-accent/50">Next</p>
            <p className="line-clamp-1 text-sm font-medium text-content transition-colors group-hover:text-accent">
              {next.title}
            </p>
          </div>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0 text-accent/50 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-accent"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>
      ) : (
        <div />
      )}
    </nav>
  );
}
