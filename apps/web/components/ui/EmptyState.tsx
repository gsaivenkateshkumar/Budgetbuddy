import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

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
    <Card className="mx-auto flex max-w-md flex-col items-center justify-center gap-3 p-8 text-center">
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      {body && <p className="text-sm text-slate-500">{body}</p>}
      {actions && <div className="mt-1 flex flex-wrap items-center justify-center gap-3">{actions}</div>}
    </Card>
  );
}
