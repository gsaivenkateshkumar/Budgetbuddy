import type { ReactNode } from "react";

export function EmptyState({
  title,
  body,
  actions,
}: {
  title: string;
  body?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      {body && <p className="max-w-sm text-sm text-slate-500">{body}</p>}
      {actions && <div className="mt-2 flex flex-wrap items-center justify-center gap-3">{actions}</div>}
    </div>
  );
}
