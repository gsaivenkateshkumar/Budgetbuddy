import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { GUIDES } from "@/lib/guides";

export const metadata: Metadata = {
  title: "Shopping Guides",
  description:
    "Practical, original guides to help you evaluate electronics purchases — laptops, RAM, smartphones, and general buying decisions.",
};

export default function GuidesPage() {
  return (
    <Container className="flex flex-col gap-8 py-10">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Shopping guides</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-600">
          Practical, independent guides for evaluating a purchase — written to help you decide what
          matters for your own use case, not to rank specific products.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {GUIDES.map((guide) => (
          <Link
            key={guide.slug}
            href={`/guides/${guide.slug}`}
            className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
          >
            <h2 className="text-sm font-semibold text-slate-900">{guide.title}</h2>
            <p className="text-sm text-slate-600">{guide.description}</p>
          </Link>
        ))}
      </div>
    </Container>
  );
}
