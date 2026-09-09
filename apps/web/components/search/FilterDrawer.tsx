"use client";

import { useState, type ReactNode } from "react";

export function FilterDrawer({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="filter-panel"
        className="mb-4 flex w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 lg:hidden"
      >
        Filters
        <span aria-hidden="true">{open ? "▲" : "▼"}</span>
      </button>
      <div id="filter-panel" className={open ? "block" : "hidden lg:block"}>
        {children}
      </div>
    </div>
  );
}
