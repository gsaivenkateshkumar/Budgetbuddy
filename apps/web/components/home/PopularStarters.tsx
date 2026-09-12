import Link from "next/link";

const STARTERS = [
  "T-shirt printing business",
  "Cloud kitchen",
  "Freelance video editing",
  "Home bakery",
  "Tuition or coaching classes",
  "Local delivery service",
];

export function PopularStarters() {
  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-900">Not sure where to start?</h2>
      <p className="mt-2 max-w-xl text-sm text-slate-600">
        Pick a common starting point — Start Currency will help you validate and plan it around your
        own budget and situation.
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        {STARTERS.map((idea) => (
          <Link
            key={idea}
            href={`/validate?idea=${encodeURIComponent(idea)}`}
            className="press-scale rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-violet-300 hover:text-violet-700"
          >
            {idea}
          </Link>
        ))}
      </div>
    </div>
  );
}
