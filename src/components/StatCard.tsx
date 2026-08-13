import { ArrowUpRight, LucideIcon } from "lucide-react";

interface Props {
  title: string;
  value: string;
  change: string;
  icon: LucideIcon;
  color: string;
}

export default function StatCard({ title, value, change, icon: Icon, color }: Props) {
  return (
    <article className="panel group p-4 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(31,42,38,0.09)] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">{title}</p>
          <p className="mt-3 text-2xl font-bold tracking-tight text-[var(--ink)] sm:text-3xl">{value}</p>
          <p className="mt-2 flex items-center gap-1 text-[11px] font-medium text-[var(--muted)] sm:text-xs">
            <ArrowUpRight size={13} className="text-[var(--coral)]" />
            <span className="truncate">{change}</span>
          </p>
        </div>
        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-[var(--ink)] shadow-sm sm:h-11 sm:w-11 ${color}`}>
          <Icon size={19} strokeWidth={2.1} />
        </div>
      </div>
    </article>
  );
}
