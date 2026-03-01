import Link from "next/link";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
  queryParams?: Record<string, string>;
}

export function Pagination({
  currentPage,
  totalPages,
  basePath,
  queryParams = {},
}: PaginationProps) {
  if (totalPages <= 1) return null;

  function buildHref(page: number) {
    const params = new URLSearchParams(queryParams);
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  // Build page numbers with ellipsis
  const pages: (number | "...")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1">
      {currentPage > 1 && (
        <Link
          href={buildHref(currentPage - 1)}
          className="mr-2 flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors duration-200 hover:bg-primary/5 hover:text-primary"
          aria-label="Previous page"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
      )}

      {pages.map((page, idx) =>
        page === "..." ? (
          <span key={`ellipsis-${idx}`} className="px-1 text-sm text-muted">
            ...
          </span>
        ) : (
          <Link
            key={page}
            href={buildHref(page)}
            className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-all duration-200 ${
              page === currentPage
                ? "bg-primary-fill text-white"
                : "text-muted hover:bg-primary/5 hover:text-primary"
            }`}
          >
            {page}
          </Link>
        ),
      )}

      {currentPage < totalPages && (
        <Link
          href={buildHref(currentPage + 1)}
          className="ml-2 flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors duration-200 hover:bg-primary/5 hover:text-primary"
          aria-label="Next page"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>
      )}
    </nav>
  );
}
