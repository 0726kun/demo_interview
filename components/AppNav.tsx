"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/products", label: "产品货架" },
  { href: "/clients", label: "客户管理" },
  { href: "/dashboard", label: "数据概览" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--card-border)] bg-[var(--background)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--background)]/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="font-display text-lg font-semibold tracking-tight text-[var(--foreground)] transition-opacity hover:opacity-90"
        >
          渠道工作台
        </Link>
        <nav className="flex items-center gap-1" aria-label="主导航">
          {navItems.map(({ href, label }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[var(--surface)] text-[var(--accent)]"
                    : "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
