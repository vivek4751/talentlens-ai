"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { LogOut, Moon, Search, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import NotificationCenter from "./NotificationCenter";

export default function Navbar() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { theme, mounted, toggleTheme } = useTheme();
  const currentSearch = searchParams.get("search") || "";

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("search", value);
    else params.delete("search");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  const displayName = session?.user?.name || "User";
  const displayRole = (session?.user as { role?: string })?.role || "guest";
  const avatarLetter = displayName.charAt(0).toUpperCase();

  return (
    <header className="flex min-h-[72px] items-center gap-3 rounded-2xl border border-[var(--line)] bg-[rgba(255,253,248,0.88)] px-3 py-3 shadow-[0_12px_32px_rgba(31,42,38,0.06)] backdrop-blur-xl dark:bg-[rgba(32,43,37,0.9)] sm:px-4 lg:px-5">
      <div className="min-w-0 flex-1 pl-12 sm:pl-0">
        <div className="relative w-full max-w-[520px]">
          <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <input
            type="search"
            placeholder={displayRole === "candidate" ? "Search jobs" : "Search candidates or jobs"}
            value={currentSearch}
            onChange={handleSearchChange}
            className="h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--surface-soft)]/70 pl-10 pr-3 text-sm font-medium text-[var(--ink)] outline-none transition placeholder:text-[var(--muted)] hover:border-[#b9c0b7] focus:border-[var(--coral)] focus:bg-[var(--surface)] focus:ring-4 focus:ring-[var(--coral)]/10"
          />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          onClick={toggleTheme}
          className="hidden h-10 w-10 items-center justify-center rounded-xl text-[var(--muted)] transition hover:bg-[var(--surface-soft)] hover:text-[var(--ink)] sm:inline-flex"
        >
          {mounted && theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <NotificationCenter />

        <div className="ml-1 flex items-center gap-2 border-l border-[var(--line)] pl-2 sm:ml-2 sm:gap-3 sm:pl-3">
          <Link href="/settings" className="flex min-w-0 items-center gap-2 rounded-xl p-1 transition hover:bg-[var(--surface-soft)] sm:gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--sage)] text-sm font-bold text-[var(--ink)] shadow-sm">
              {avatarLetter}
            </div>
            <div className="hidden min-w-0 sm:block">
              <p className="max-w-[130px] truncate text-sm font-semibold leading-tight text-[var(--ink)]">{displayName}</p>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">{displayRole}</p>
            </div>
          </Link>
          <button type="button" onClick={() => signOut({ callbackUrl: "/login" })} aria-label="Log out" title="Log out" className="hidden h-10 w-10 items-center justify-center rounded-xl bg-[#f8e7e2] text-[var(--coral-deep)] transition hover:bg-[#f2d5ce] sm:inline-flex">
            <LogOut size={17} />
          </button>
        </div>
      </div>
    </header>
  );
}
