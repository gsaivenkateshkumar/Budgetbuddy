export default function SearchLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 h-8 w-56 animate-pulse rounded bg-slate-200" />
      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <div className="h-96 animate-pulse rounded-xl bg-slate-100" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      </div>
    </div>
  );
}
