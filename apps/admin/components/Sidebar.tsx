"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Globe,
  FileText,
  Workflow,
  Search,
  ClipboardList,
  BarChart3,
  Settings,
  PanelLeftClose,
  PanelLeft,
  LogOut,
  Sun,
  Moon,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/overview", label: "Dashboard", icon: LayoutDashboard },
  { href: "/blogs", label: "Blogs", icon: Globe },
  { href: "/posts", label: "Posts", icon: FileText },
  { href: "/content-plans", label: "Content Plans", icon: ClipboardList },
  { href: "/pipeline", label: "Pipeline", icon: Workflow },
  { href: "/keywords", label: "Keywords", icon: Search },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.getAttribute("data-theme") === "dark");
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  // On mobile, always show expanded (not collapsed)
  const isCollapsed = collapsed;

  return (
    <aside
      className={cn(
        // Base styles
        "flex h-screen flex-col border-r border-edge/40 bg-surface transition-all duration-200 dark:border-white/5",
        // Desktop: static positioning, respect collapsed state
        "hidden md:flex",
        isCollapsed ? "md:w-16" : "md:w-60",
        // Mobile: fixed overlay drawer
        mobileOpen && "fixed inset-y-0 left-0 z-40 flex w-60",
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center justify-between border-b border-edge/40 px-4 dark:border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-fill text-xs font-bold text-white">
            P
          </div>
          {(!isCollapsed || mobileOpen) && (
            <span className="text-sm font-semibold text-content">Postloom</span>
          )}
        </div>
        {/* Mobile close button */}
        {mobileOpen && (
          <button
            onClick={onMobileClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-alt hover:text-content md:hidden"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 space-y-1 px-2 py-3">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/overview" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={onMobileClose}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-surface-alt hover:text-content",
                isCollapsed && !mobileOpen && "justify-center px-0",
              )}
              title={isCollapsed && !mobileOpen ? label : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {(!isCollapsed || mobileOpen) && label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="space-y-1 border-t border-edge/40 p-2 dark:border-white/5">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={dark ? "Switch to light mode" : "Switch to dark mode"}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-alt hover:text-content",
            isCollapsed && !mobileOpen && "justify-center px-0",
          )}
        >
          {dark ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />}
          {(!isCollapsed || mobileOpen) && (dark ? "Light Mode" : "Dark Mode")}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          title="Logout"
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive",
            isCollapsed && !mobileOpen && "justify-center px-0",
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {(!isCollapsed || mobileOpen) && "Logout"}
        </button>

        {/* Collapse toggle — desktop only */}
        <button
          onClick={onToggle}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "hidden w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-alt hover:text-content md:flex",
            isCollapsed && "justify-center px-0",
          )}
        >
          {isCollapsed ? (
            <PanelLeft className="h-4 w-4 shrink-0" />
          ) : (
            <PanelLeftClose className="h-4 w-4 shrink-0" />
          )}
          {!isCollapsed && "Collapse"}
        </button>
      </div>
    </aside>
  );
}
