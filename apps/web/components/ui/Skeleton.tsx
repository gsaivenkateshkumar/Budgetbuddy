export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`rounded-lg bg-slate-100 ${className}`} aria-hidden="true" />;
}
