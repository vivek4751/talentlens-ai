"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { BarChart3, BriefcaseBusiness, LayoutDashboard, Menu, Settings, Trophy, Upload, Users, X } from "lucide-react";

const recruiterMenus = [
  { name: "Overview", icon: LayoutDashboard, href: "/dashboard" },
  { name: "Jobs", icon: BriefcaseBusiness, href: "/jobs" },
  { name: "Candidates", icon: Users, href: "/candidates" },
  { name: "AI rankings", icon: Trophy, href: "/rankings" },
  { name: "Analytics", icon: BarChart3, href: "/analytics" },
  { name: "Import resume", icon: Upload, href: "/upload-resume" },
  { name: "Settings", icon: Settings, href: "/settings" },
];

const candidateMenus = [
  { name: "Open roles", icon: BriefcaseBusiness, href: "/jobs" },
  { name: "My applications", icon: Trophy, href: "/candidates/applications" },
  { name: "Application status", icon: LayoutDashboard, href: "/candidates/status" },
  { name: "Resume upload", icon: Upload, href: "/upload-resume" },
  { name: "My profile", icon: Users, href: "/settings" },
  { name: "Settings", icon: Settings, href: "/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const role = (session?.user as { role?: string } | undefined)?.role || "recruiter";
  const menus = role === "candidate" ? candidateMenus : recruiterMenus;
  const displayName = session?.user?.name || "Recruiter";
  const initials = displayName.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const isActive = (href: string) => pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
  const close = () => setOpen(false);

  return <>
    <button type="button" onClick={() => setOpen(true)} aria-label="Open navigation" className="fixed left-4 top-3 z-40 grid h-9 w-9 place-items-center border border-[var(--line)] bg-white lg:hidden"><Menu size={18} /></button>
    {open && <button type="button" aria-label="Close navigation overlay" onClick={close} className="fixed inset-0 z-40 bg-black/35 lg:hidden" />}
    <aside className="tl-sidebar" data-open={open} aria-label="Primary navigation">
      <div className="tl-brand">
        <Link href="/dashboard" onClick={close} className="tl-mark">TL</Link>
        <div><p className="tl-brand-title">TALENTLENS</p><p className="tl-brand-subtitle">Recruitment intelligence</p></div>
        <button type="button" onClick={close} className="ml-auto lg:hidden" aria-label="Close navigation"><X size={18} /></button>
      </div>
      <div className="tl-role-tag"><p className="tl-micro">WORKSPACE MODE</p><p className="tl-role-value">{role === "candidate" ? "Candidate" : "Recruiter"} workspace</p></div>
      <nav className="tl-nav">
        <span className="tl-micro tl-nav-label">{role === "candidate" ? "CANDIDATE" : "RECRUITER"} MENU</span>
        {menus.map((menu) => { const Icon = menu.icon; const active = isActive(menu.href); return <Link key={menu.name} href={menu.href} onClick={close} className="tl-nav-link" data-active={active}><Icon size={17} strokeWidth={1.8} /><span>{menu.name}</span></Link>; })}
      </nav>
      <div className="tl-profile"><div className="tl-profile-row"><span className="tl-avatar">{initials || "TL"}</span><div><p className="tl-profile-name">{displayName}</p><p className="tl-profile-meta">{role} account</p></div></div><button type="button" onClick={() => signOut({ callbackUrl: "/login" })} className="tl-signout">Sign out</button></div>
    </aside>
  </>;
}
