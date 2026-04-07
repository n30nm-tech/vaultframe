"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Film, Search, Shield } from "lucide-react";
import type { PropsWithChildren } from "react";
import { navigationItems } from "@/lib/navigation";

export function AppShell({ children }: PropsWithChildren) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background bg-hero-glow text-foreground">
      <div className="mx-auto flex min-h-screen max-w-[1680px]">
        <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-surface/80 px-6 py-8 backdrop-blur xl:block">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10 text-accent">
              <Film className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight">VaultFrame</p>
              <p className="text-sm text-slate-400">Self-hosted media library</p>
            </div>
          </Link>

          <nav className="mt-10 space-y-2">
            {navigationItems.map((item) => {
              const isActive =
                item.href === "/" ? pathname === item.href : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "flex items-start gap-3 rounded-2xl border px-4 py-4 transition",
                    isActive
                      ? "border-accent/30 bg-accent/10 text-white shadow-panel"
                      : "border-transparent bg-white/[0.03] text-slate-300 hover:border-white/10 hover:bg-white/[0.06]",
                  )}
                >
                  <item.icon className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-400">{item.description}</p>
                  </div>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-success" />
              <p className="font-medium">Production-minded foundation</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              PostgreSQL, Prisma, and Docker are ready for persistent libraries and scanned media.
            </p>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-white/10 bg-background/80 backdrop-blur">
            <div className="flex items-center justify-between px-5 py-4 sm:px-8">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Media Library</p>
                <h1 className="text-xl font-semibold tracking-tight text-white">VaultFrame control center</h1>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-1 lg:flex">
                  {navigationItems.map((item) => {
                    const isActive =
                      item.href === "/" ? pathname === item.href : pathname.startsWith(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={clsx(
                          "rounded-xl px-3 py-2 text-sm transition",
                          isActive
                            ? "bg-accent/10 text-white"
                            : "text-slate-400 hover:bg-white/[0.05] hover:text-white",
                        )}
                      >
                        {item.title}
                      </Link>
                    );
                  })}
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-slate-400">
                  <Search className="h-4 w-4" />
                  <span className="hidden text-sm sm:inline">Library, scan, thumbnails, and media browsing are live</span>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 px-5 py-6 sm:px-8 sm:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
