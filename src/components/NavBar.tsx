"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { LogOut, Search } from "lucide-react";
import { signOut } from "next-auth/react";
import NotificationCenter from "./NotificationCenter";

export default function Navbar() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSearch = searchParams.get("search") || "";
  const role = (session?.user as { role?: string } | undefined)?.role || "recruiter";
  const name = session?.user?.name || "User";
  const updateSearch = (value: string) => { const next = new URLSearchParams(searchParams.toString()); if (value) { next.set("search", value); } else { next.delete("search"); } router.replace(next.toString() ? `${pathname}?${next.toString()}` : pathname); };
  return <header className="tl-topline"><p className="tl-topline-note"><span className="tl-topline-square" />Data-led talent decisions</p><div className="tl-topline-tools"><label className="tl-search"><Search size={15} /><input value={currentSearch} onChange={(event) => updateSearch(event.target.value)} placeholder={role === "candidate" ? "Search roles" : "Search jobs or candidates"} /></label><NotificationCenter /><Link href="/settings" className="tl-topline-avatar" aria-label="Open settings">{name.charAt(0).toUpperCase()}</Link><button type="button" onClick={() => signOut({ callbackUrl: "/login" })} className="hidden text-[var(--muted)] sm:inline-flex" aria-label="Log out"><LogOut size={16} /></button></div></header>;
}
