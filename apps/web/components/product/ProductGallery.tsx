"use client";

import { useState } from "react";
import type { ImageRead } from "@/lib/api/types";

function InitialTile({ label }: { label: string }) {
  return (
    <div
      className="flex aspect-square w-full items-center justify-center rounded-xl bg-gradient-to-br from-violet-50 to-slate-100 text-5xl font-semibold text-violet-300"
      aria-hidden="true"
    >
      {label.charAt(0).toUpperCase()}
    </div>
  );
}

/** Renders real product imagery when the backend has it; falls back to the
 * same initial-letter placeholder used elsewhere rather than a broken
 * <img> — seed/mock data historically used non-resolving placeholder
 * URLs (see docs/data-sources.md). */
export function ProductGallery({ images, label }: { images: ImageRead[]; label: string }) {
  const [failedIndexes, setFailedIndexes] = useState<Set<number>>(new Set());
  const [activeIndex, setActiveIndex] = useState(0);

  const usable = images.map((img, i) => ({ img, i })).filter(({ i }) => !failedIndexes.has(i));

  if (usable.length === 0) return <InitialTile label={label} />;

  const active = usable[Math.min(activeIndex, usable.length - 1)];

  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element -- external, unpredictable retailer/catalog hosts */}
        <img
          src={active.img.url}
          alt={active.img.alt_text ?? label}
          className="aspect-square w-full object-contain"
          onError={() => setFailedIndexes((prev) => new Set(prev).add(active.i))}
        />
      </div>
      {usable.length > 1 && (
        <div className="flex gap-2">
          {usable.map(({ img, i }, displayIndex) => (
            <button
              key={img.url}
              type="button"
              onClick={() => setActiveIndex(displayIndex)}
              aria-label={`Show image ${displayIndex + 1}`}
              className={`h-14 w-14 overflow-hidden rounded-lg border ${
                i === active.i ? "border-violet-500" : "border-slate-200"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- thumbnail of the same external image */}
              <img src={img.url} alt="" className="h-full w-full object-cover" aria-hidden="true" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
