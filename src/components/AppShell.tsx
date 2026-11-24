"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  History,
  Home,
  Image as ImageIcon,
  LayoutDashboard,
  Menu,
  Moon,
  Newspaper,
  Sun,
  X,
} from "lucide-react";
import { VerityLogo } from "@/components/VerityLogo";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/image-intelligence", label: "Image Intelligence", icon: ImageIcon },
  { href: "/news-intelligence", label: "News Intelligence", icon: Newspaper },
  { href: "/document-intelligence", label: "Document Intelligence", icon: FileText },
  { href: "/history", label: "Investigation History", icon: History },
];

export function AppShell({
  breadcrumb,
  action,
  children,
}: {
  breadcrumb: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [darkMode, setDarkMode] = React.useState(false);

  React.useEffect(() => {
    setDarkMode(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-[#0B1120] text-slate-200 border-r border-slate-800/80">
        <div className="flex h-16 items-center px-6 border-b border-slate-800/80">
          <VerityLogo href="/" light />
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto" aria-label="Workspace navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap",
                  active
                    ? "bg-indigo-600 text-white"
                    : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}

          <div className="pt-4 mt-4 border-t border-slate-800/80">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-800/70 hover:text-white transition-colors whitespace-nowrap"
            >
              <Home className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Landing Page</span>
            </Link>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800/80 space-y-3">
          <div className="rounded-lg bg-slate-900/90 border border-slate-800 px-3 py-2.5">
            <p className="text-xs font-medium text-slate-200">
              Prototype API Mode
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400 leading-relaxed">
              Next.js API routes active · FastAPI client adapter ready
            </p>
          </div>

          <div className="flex items-center gap-3 px-1">
            <img
              src="/images/avatar_analyst.jpg"
              alt="Lead Verification Analyst"
              referrerPolicy="no-referrer"
              className="h-9 w-9 rounded-full object-cover border border-slate-700 shrink-0 bg-slate-800"
            />
            <div className="min-w-0">
              <p className="text-xs font-medium text-white truncate">
                Research Workspace
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                Public Verification Tier
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden bg-slate-950/60 backdrop-blur-xs"
          onClick={() => setMobileOpen(false)}
        >
          <aside
            className="w-72 h-full bg-[#0B1120] text-slate-200 flex flex-col border-r border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-16 items-center justify-between px-5 border-b border-slate-800">
              <VerityLogo href="/" light />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation menu"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                      active
                        ? "bg-indigo-600 text-white"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <Home className="h-4 w-4 shrink-0" />
                <span>Landing Page</span>
              </Link>
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content Viewport */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 truncate">
              <Link
                href="/dashboard"
                className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap"
              >
                VerityAI
              </Link>
              <span aria-hidden="true">/</span>
              <span className="font-medium text-slate-900 dark:text-slate-100 truncate">
                {breadcrumb}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle color theme"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            {action}
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
