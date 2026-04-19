"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { EyeOff, Film, Menu, Search, Shield, X } from "lucide-react";
import type { PropsWithChildren } from "react";
import { navigationItems } from "@/lib/navigation";

export function AppShell({
  children,
  authEnabled,
  idleTimeoutMinutes,
}: PropsWithChildren<{
  authEnabled: boolean;
  idleTimeoutMinutes: number | null;
}>) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [panicBlurActive, setPanicBlurActive] = useState(false);
  const [panicArmed, setPanicArmed] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPanicArmed(false);
        setPanicBlurActive(false);
        return;
      }

      if (!panicArmed) {
        return;
      }

      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      setPanicBlurActive(true);
      setPanicArmed(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [panicArmed]);

  useEffect(() => {
    if (!authEnabled || !idleTimeoutMinutes || pathname === "/login") {
      return;
    }

    const timeoutMs = idleTimeoutMinutes * 60 * 1000;
    const storageKey = "vaultframe-last-activity-at";
    let logoutTimer: number | null = null;

    const getLastActivity = () => {
      const stored = window.localStorage.getItem(storageKey);
      const parsed = stored ? Number(stored) : Date.now();
      return Number.isFinite(parsed) ? parsed : Date.now();
    };

    const scheduleLogout = () => {
      if (logoutTimer) {
        window.clearTimeout(logoutTimer);
      }

      const msRemaining = timeoutMs - (Date.now() - getLastActivity());

      if (msRemaining <= 0) {
        const returnTo = `${window.location.pathname}${window.location.search}`;
        window.location.href = `/api/auth/logout?reason=idle&returnTo=${encodeURIComponent(returnTo)}`;
        return;
      }

      logoutTimer = window.setTimeout(() => {
        const returnTo = `${window.location.pathname}${window.location.search}`;
        window.location.href = `/api/auth/logout?reason=idle&returnTo=${encodeURIComponent(returnTo)}`;
      }, msRemaining);
    };

    const recordActivity = () => {
      window.localStorage.setItem(storageKey, String(Date.now()));
      scheduleLogout();
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === storageKey) {
        scheduleLogout();
      }
    };

    recordActivity();

    const activityEvents: Array<keyof WindowEventMap> = [
      "pointerdown",
      "keydown",
      "touchstart",
      "scroll",
      "mousemove",
    ];

    for (const eventName of activityEvents) {
      window.addEventListener(eventName, recordActivity, { passive: true });
    }

    window.addEventListener("storage", handleStorage);

    return () => {
      if (logoutTimer) {
        window.clearTimeout(logoutTimer);
      }

      for (const eventName of activityEvents) {
        window.removeEventListener(eventName, recordActivity);
      }

      window.removeEventListener("storage", handleStorage);
    };
  }, [authEnabled, idleTimeoutMinutes, pathname]);

  if (pathname === "/login") {
    return <div className="min-h-screen bg-background bg-hero-glow text-foreground">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-background bg-hero-glow text-foreground">
      <div className="mx-auto flex min-h-screen max-w-[1680px]">
        <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-surface/80 px-6 py-8 backdrop-blur xl:block">
          <ShellNav pathname={pathname} />
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-white/10 bg-background/80 backdrop-blur">
            <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(true)}
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-slate-200 transition hover:bg-white/[0.06] hover:text-white xl:hidden"
                  aria-label="Open navigation"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500 sm:text-sm">
                    Media Library
                  </p>
                  <div className="flex min-w-0 items-center gap-2">
                    <h1 className="truncate text-lg font-semibold tracking-tight text-white sm:text-xl">
                      VaultFrame control center
                    </h1>
                    <span className="shrink-0 rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent sm:text-[11px]">
                      v4.0.12
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (panicBlurActive) {
                      setPanicBlurActive(false);
                      setPanicArmed(false);
                      return;
                    }

                    setPanicArmed((current) => !current);
                  }}
                  className={clsx(
                    "inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm transition",
                    panicBlurActive
                      ? "border-rose-500/30 bg-rose-500/15 text-rose-100"
                      : panicArmed
                        ? "border-amber-400/30 bg-amber-400/15 text-amber-100"
                        : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.05] hover:text-white",
                  )}
                >
                  <EyeOff className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {panicBlurActive ? "Clear Panic Blur" : panicArmed ? "Press any key" : "Arm Panic Blur"}
                  </span>
                </button>

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

                <div className="hidden items-center gap-3 sm:flex">
                  {authEnabled ? (
                    <button
                      type="button"
                      onClick={() => {
                        window.location.href = "/api/auth/logout";
                      }}
                      className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300 transition hover:bg-white/[0.05] hover:text-white"
                    >
                      Lock now
                    </button>
                  ) : null}
                  <div className="hidden items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-slate-400 lg:flex">
                    <Search className="h-4 w-4" />
                    <span className="text-sm">Library, scan, thumbnails, and media browsing are live</span>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main
            className={clsx(
              "flex-1 px-4 py-5 pb-24 sm:px-6 sm:py-6 sm:pb-6 lg:px-8 lg:py-8",
              panicBlurActive &&
                "[&_img]:blur-2xl [&_img]:brightness-75 [&_img]:transition [&_video]:blur-2xl [&_video]:brightness-75 [&_video]:transition",
            )}
          >
            {children}
          </main>
        </div>
      </div>

      {mobileNavOpen ? (
        <div className="fixed inset-0 z-40 xl:hidden">
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            aria-label="Close navigation"
          />
          <div className="relative h-full w-[88vw] max-w-sm border-r border-white/10 bg-[#090c11] px-5 py-5 shadow-2xl">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold tracking-tight text-white">VaultFrame</p>
                  <span className="shrink-0 rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
                    v4.0.12
                  </span>
                </div>
                <p className="text-sm text-slate-400">Self-hosted media library</p>
              </div>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-slate-200 transition hover:bg-white/[0.06] hover:text-white"
                aria-label="Close navigation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <ShellNav pathname={pathname} />
          </div>
        </div>
      ) : null}

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#090c11]/95 px-2 py-2 backdrop-blur xl:hidden">
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${navigationItems.length}, minmax(0, 1fr))` }}
        >
          {navigationItems.map((item) => {
            const isActive =
              item.href === "/" ? pathname === item.href : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium transition",
                  isActive
                    ? "bg-accent/10 text-white"
                    : "text-slate-400 hover:bg-white/[0.05] hover:text-white",
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.title}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function ShellNav({ pathname }: { pathname: string }) {
  return (
    <>
      <Link href="/" className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10 text-accent">
          <Film className="h-6 w-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-lg font-semibold tracking-tight">VaultFrame</p>
            <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
              v4.0.12
            </span>
          </div>
          <p className="text-sm text-slate-400">Self-hosted media library</p>
        </div>
      </Link>

      <nav className="mt-8 space-y-2">
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

      <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-5 xl:mt-auto">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-success" />
          <p className="font-medium">Production-minded foundation</p>
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          PostgreSQL, Prisma, and Docker are ready for persistent libraries and scanned media.
        </p>
      </div>
    </>
  );
}
