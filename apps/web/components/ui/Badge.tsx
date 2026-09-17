import type { ReactNode } from "react";
import { badgeClass, stageBadgeClass, type BadgeTone } from "@/lib/ui";

export function Badge({
  children,
  tone = "neutral",
  stage,
  className = "",
}: {
  children: ReactNode;
  tone?: BadgeTone;
  /** BusinessProject.stage value — when set, overrides `tone` with the
   * Validate/Plan/Launch/Manage/Grow lifecycle palette. */
  stage?: string;
  className?: string;
}) {
  return <span className={stage ? stageBadgeClass(stage, className) : badgeClass(tone, className)}>{children}</span>;
}
