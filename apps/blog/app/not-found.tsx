import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="animate-fade-in-up">
        <p className="mb-4 text-8xl font-bold text-primary">
          404
        </p>
        <h1 className="mb-2 text-xl font-medium text-content">
          Page not found
        </h1>
        <p className="mb-8 text-sm text-muted">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="btn-outline-primary"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Home
        </Link>
      </div>
    </div>
  );
}
