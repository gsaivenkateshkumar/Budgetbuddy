import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { Card } from "@/components/ui/Card";
import { getGuide, GUIDES, readingTimeMinutes } from "@/lib/guides";

type GuidePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return GUIDES.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return { title: "Guide" };
  return { title: guide.title, description: guide.description };
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  const related = GUIDES.filter((g) => g.slug !== guide.slug).slice(0, 2);

  return (
    <Container className="py-10">
      <Link href="/guides" className="text-sm font-medium text-violet-600 hover:text-violet-700">
        &larr; All guides
      </Link>

      <article className="mx-auto mt-6 max-w-2xl">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{guide.title}</h1>
        <p className="mt-3 text-base text-slate-500">{guide.description}</p>
        <p className="mt-2 text-xs font-medium uppercase tracking-wide text-slate-500">
          {readingTimeMinutes(guide)} min read
        </p>

        <div className="mt-8 flex flex-col gap-5">
          {guide.body.map((paragraph, i) => (
            <p key={i} className="text-[15px] leading-relaxed text-slate-700">
              {paragraph}
            </p>
          ))}
        </div>
      </article>

      {related.length > 0 && (
        <div className="mx-auto mt-12 max-w-2xl border-t border-slate-200 pt-8">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Related guides
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {related.map((g) => (
              <Card key={g.slug} hover className="p-4">
                <Link href={`/guides/${g.slug}`} className="flex flex-col gap-1">
                  <h3 className="text-sm font-semibold text-slate-900">{g.title}</h3>
                  <p className="text-xs text-slate-500">{g.description}</p>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      )}
    </Container>
  );
}
