import Link from "next/link";

const GOALS = [
  "Laptop for college",
  "Phone for photography",
  "Home office setup",
  "Gaming setup",
  "Small business equipment",
];

export function GoalBasedShopping() {
  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-900">Tell us what you&apos;re trying to accomplish</h2>
      <p className="mt-2 max-w-xl text-sm text-slate-600">
        Budget Buddy isn&apos;t just a product search box — describe the outcome you&apos;re after, and
        Ask Budget Buddy will help you work out what to buy.
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        {GOALS.map((goal) => (
          <Link
            key={goal}
            href={`/ask?q=${encodeURIComponent(`What do I need for: ${goal}?`)}`}
            className="press-scale rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-violet-300 hover:text-violet-700"
          >
            {goal}
          </Link>
        ))}
      </div>
    </div>
  );
}
