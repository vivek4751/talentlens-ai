import { ReactNode, Suspense } from "react";
import Sidebar from "./SideBar";
import Navbar from "./NavBar";

interface Props {
  children: ReactNode;
}

export default function DashboardLayout({ children }: Props) {
  return (
    <div className="min-h-screen bg-transparent text-slate-900">
      <Sidebar />

      <div className="min-h-screen min-w-0 lg:pl-72">
        <div className="mx-auto flex min-h-screen w-full max-w-[1680px] flex-col">
          <div className="sticky top-0 z-30 px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8">
            <Suspense fallback={<div className="h-[72px] animate-pulse rounded-2xl bg-white/80" />}>
              <Navbar />
            </Suspense>
          </div>

          <main className="flex-1 px-4 pb-8 pt-5 sm:px-6 sm:pb-10 sm:pt-6 lg:px-8 lg:pb-12 lg:pt-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
