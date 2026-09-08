export function EmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
      <p className="text-sm font-medium text-slate-700">{title}</p>
      {body && <p className="mt-1 text-sm text-slate-500">{body}</p>}
    </div>
  );
}
