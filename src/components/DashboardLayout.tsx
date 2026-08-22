import { ReactNode, Suspense } from "react";
import Sidebar from "./SideBar";
import Navbar from "./NavBar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <div className="tl-shell"><Sidebar /><div className="tl-workspace"><Suspense fallback={<header className="tl-topline" />}><Navbar /></Suspense><main className="tl-main">{children}</main></div></div>;
}
