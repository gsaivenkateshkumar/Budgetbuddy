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
      className={`rounded-xl border border-slate-200 bg-white ${
        hover ? "transition-colors hover:border-violet-300" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
