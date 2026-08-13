"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState } from "react";
import {
  LayoutDashboard,
  Upload,
  BriefcaseBusiness,
  Users,
  Trophy,
  BarChart3,
  Settings,
  X,
  Menu,
  ChevronRight,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const role = (session?.user as { role?: string } | undefined)?.role || "recruiter";

  const recruiterMenus = [
    { name: "Overview", icon: LayoutDashboard, href: "/dashboard" },
    { name: "Import resume", icon: Upload, href: "/upload-resume" },
    { name: "Jobs", icon: BriefcaseBusiness, href: "/jobs" },
    { name: "AI rankings", icon: Trophy, href: "/rankings" },
    { name: "Analytics", icon: BarChart3, href: "/analytics" },
    { name: "Profile & settings", icon: Settings, href: "/settings" },
  ];

  const candidateMenus = [
    { name: "Available jobs", icon: BriefcaseBusiness, href: "/jobs" },
    { name: "Upload resume", icon: Upload, href: "/upload-resume" },
    { name: "My applications", icon: Trophy, href: "/candidates/applications" },
    { name: "Application status", icon: LayoutDashboard, href: "/candidates/status" },
    { name: "My profile", icon: Users, href: `/candidates/${session?.user?.id || "profile"}` },
    { name: "Profile & settings", icon: Settings, href: "/settings" },
  ];

  const adminMenus = [
    { name: "System analytics", icon: BarChart3, href: "/admin/analytics" },
    { name: "Manage jobs", icon: BriefcaseBusiness, href: "/jobs" },
    { name: "Manage users", icon: Users, href: "/admin/users" },
    { name: "Manage recruiters", icon: Trophy, href: "/admin/recruiters" },
    { name: "Profile & settings", icon: Settings, href: "/settings" },
  ];

  let menus = recruiterMenus;
  if (role === "candidate") menus = candidateMenus;
  if (role === "admin") menus = adminMenus;

  const closeMenu = () => setOpen(false);
  const isActive = (href: string) => href !== "#" && (pathname === href || pathname.startsWith(`${href}/`));

  return (
    <>
      <button
        type="button"
        aria-label="Open navigation"
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-40 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] shadow-sm lg:hidden"
      >
        <Menu size={20} />
      </button>

      {open && (
        <button
          type="button"
          aria-label="Close navigation overlay"
          onClick={closeMenu}
          className="fixed inset-0 z-40 bg-[var(--ink)]/45 backdrop-blur-[2px] lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(84vw,300px)] flex-col bg-[var(--sidebar-background)] text-[var(--sidebar-foreground)] shadow-2xl transition-transform duration-300 lg:translate-x-0 lg:shadow-none ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-5 sm:px-6 sm:py-6">
          <Link href="/dashboard" onClick={closeMenu} className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--coral)] text-sm font-black tracking-tight text-white shadow-lg shadow-black/20">
              TL
            </span>
            <span>
              <span className="block text-base font-bold tracking-tight">TalentLens</span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--sidebar-muted)]">Talent operations</span>
            </span>
          </Link>
          <button
            type="button"
            aria-label="Close navigation"
            onClick={closeMenu}
            className="rounded-lg p-2 text-[var(--sidebar-muted)] transition hover:bg-white/10 hover:text-[var(--sidebar-foreground)] lg:hidden"
          >
            <X size={19} />
          </button>
        </div>

        <div className="px-5 pt-6 sm:px-6">
          <p className="mb-3 px-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--sidebar-section-label)]">Workspace</p>
          <nav className="space-y-1.5">
            {menus.map((menu) => {
              const Icon = menu.icon;
              const active = isActive(menu.href);
              return (
                <Link
                  key={menu.name}
                  href={menu.href}
                  onClick={closeMenu}
                  className={`group flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-sm font-medium transition ${
                    active
                      ? "bg-[var(--sidebar-active)] text-[var(--on-light-surface)] shadow-sm"
                      : "text-[var(--sidebar-muted)] hover:bg-white/8 hover:text-[var(--sidebar-foreground)]"
                  }`}
                >
                  <Icon size={18} strokeWidth={active ? 2.3 : 1.9} />
                  <span className="flex-1">{menu.name}</span>
                  {active && <ChevronRight size={15} className="text-[var(--coral-deep)]" />}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-4 sm:p-5">
          <div className="rounded-2xl border border-white/10 bg-[var(--sidebar-card)] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--sidebar-section-label)]">Signed in as</p>
            <div className="mt-3 flex items-center gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--sage)] text-sm font-bold text-[var(--on-light-surface)]">
                {(session?.user?.name || "G").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--sidebar-foreground)]">{session?.user?.name || "Guest"}</p>
                <p className="mt-0.5 text-xs capitalize text-[var(--sidebar-muted)]">{role}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
