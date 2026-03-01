import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

interface HeaderProps {
  blogName: string;
}

export function Header({ blogName }: HeaderProps) {
  return (
    <header className="fixed top-0 right-0 left-0 z-50 border-b border-edge/40 bg-surface/50 backdrop-blur-2xl backdrop-saturate-150">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-content transition-opacity hover:opacity-80"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-fill text-xs font-bold text-white">
            {blogName.charAt(0)}
          </span>
          {blogName}
        </Link>

        <ThemeToggle />
      </div>
    </header>
  );
}
