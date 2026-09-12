import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={`depth-card rounded-xl border border-slate-200 bg-white ${
        hover ? "transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
