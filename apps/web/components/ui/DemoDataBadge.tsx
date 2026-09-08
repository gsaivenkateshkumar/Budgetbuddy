/** Trust principle: mock/demo data must never be presented as live. */
export function DemoDataBadge() {
  return (
    <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
      Demo data
    </span>
  );
}
