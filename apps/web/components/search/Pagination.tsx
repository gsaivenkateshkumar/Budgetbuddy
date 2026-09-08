import Link from "next/link";

function buildHref(pathname: string, params: URLSearchParams, page: number): string {
  const next = new URLSearchParams(params);
  next.set("page", String(page));
  return `${pathname}?${next.toString()}`;
}

export function Pagination({
  pathname,
  params,
  page,
  totalPages,
}: {
  pathname: string;
  params: URLSearchParams;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-3 pt-8">
      <Link
        href={buildHref(pathname, params, Math.max(1, page - 1))}
        aria-disabled={prevDisabled}
        tabIndex={prevDisabled ? -1 : undefined}
        className={`rounded-md border px-3 py-2 text-sm ${
          prevDisabled
            ? "pointer-events-none border-slate-100 text-slate-300"
            : "border-slate-300 text-slate-700 hover:bg-slate-50"
        }`}
      >
        Previous
      </Link>
      <span className="text-sm text-slate-500">
        Page {page} of {totalPages}
      </span>
      <Link
        href={buildHref(pathname, params, Math.min(totalPages, page + 1))}
        aria-disabled={nextDisabled}
        tabIndex={nextDisabled ? -1 : undefined}
        className={`rounded-md border px-3 py-2 text-sm ${
          nextDisabled
            ? "pointer-events-none border-slate-100 text-slate-300"
            : "border-slate-300 text-slate-700 hover:bg-slate-50"
        }`}
      >
        Next
      </Link>
    </nav>
  );
}
