"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, Check, CheckCheck, X } from "lucide-react";

type NotificationItem = {
  id: string;
  title: string;
  detail: string;
  time: string;
  tone: "coral" | "sage" | "ochre";
  read: boolean;
};

const initialNotifications: NotificationItem[] = [
  { id: "ranking-ready", title: "Ranking run complete", detail: "Your latest candidate shortlist is ready to review.", time: "Just now", tone: "coral", read: false },
  { id: "resume-import", title: "Resume import finished", detail: "New profile signals were added to your workspace.", time: "18 min ago", tone: "sage", read: false },
  { id: "weekly-review", title: "Weekly review available", detail: "Your hiring activity summary is ready.", time: "Yesterday", tone: "ochre", read: true },
];

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>(initialNotifications);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const saved = window.localStorage.getItem("talentlens-notifications");
      if (!saved) return;
      try {
        setItems(JSON.parse(saved) as NotificationItem[]);
      } catch {
        window.localStorage.removeItem("talentlens-notifications");
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("talentlens-notifications", JSON.stringify(items));
  }, [items]);

  const unreadCount = useMemo(() => items.filter((item) => !item.read).length, [items]);

  const markAllRead = () => {
    setItems((current) => current.map((item) => ({ ...item, read: true })));
  };

  const dismiss = (id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  };

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={`View notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-[var(--muted)] transition hover:bg-[var(--surface-soft)] hover:text-[var(--ink)]"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute right-2 top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--coral)] px-1 text-[9px] font-bold text-white ring-2 ring-[var(--surface)]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <button type="button" aria-label="Close notifications" onClick={() => setOpen(false)} className="fixed inset-0 z-40 cursor-default" />
          <div className="absolute right-0 top-12 z-50 w-[min(92vw,360px)] overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-[0_20px_50px_rgba(31,42,38,0.18)]">
            <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
              <div>
                <p className="text-sm font-bold text-[var(--ink)]">Notifications</p>
                <p className="mt-0.5 text-xs text-[var(--muted)]">{unreadCount ? `${unreadCount} need your attention` : "You are all caught up"}</p>
              </div>
              {unreadCount > 0 && (
                <button type="button" onClick={markAllRead} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-[var(--coral-deep)] transition hover:bg-[#f8e7e2]">
                  <CheckCheck size={14} />
                  Mark read
                </button>
              )}
            </div>

            <div className="max-h-[360px] overflow-y-auto">
              {items.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <Check size={22} className="mx-auto text-[var(--sage-deep)]" />
                  <p className="mt-3 text-sm font-semibold text-[var(--ink)]">Nothing new here</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">New workspace activity will appear here.</p>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className={`group flex gap-3 border-b border-[var(--line)] px-4 py-3 last:border-b-0 ${item.read ? "opacity-70" : ""}`}>
                    <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${item.tone === "coral" ? "bg-[var(--coral)]" : item.tone === "sage" ? "bg-[var(--sage-deep)]" : "bg-[var(--ochre)]"}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-[var(--ink)]">{item.title}</p>
                        <button type="button" aria-label={`Dismiss ${item.title}`} onClick={() => dismiss(item.id)} className="rounded-md p-1 text-[var(--muted)] opacity-0 transition hover:bg-[var(--surface-soft)] group-hover:opacity-100">
                          <X size={14} />
                        </button>
                      </div>
                      <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{item.detail}</p>
                      <p className="mt-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">{item.time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
