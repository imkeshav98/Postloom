"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

interface HeaderProps {
  blogName: string;
  logoUrl?: string | null;
}

export function Header({ blogName, logoUrl }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 right-0 left-0 z-50 transition-all duration-300 ease-in-out ${
        scrolled
          ? "bg-surface/35 backdrop-blur-3xl backdrop-saturate-150"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-content transition-opacity hover:opacity-80"
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={blogName}
              className="h-8 w-8 rounded-xl object-cover"
            />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-fill text-xs font-bold text-white">
              {blogName.charAt(0)}
            </span>
          )}
          {blogName}
        </Link>

        <ThemeToggle />
      </div>
    </header>
  );
}
