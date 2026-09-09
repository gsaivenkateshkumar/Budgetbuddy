import type { ReactNode } from "react";
import { badgeClass, type BadgeTone } from "@/lib/ui";

export function Badge({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return <span className={badgeClass(tone, className)}>{children}</span>;
}
