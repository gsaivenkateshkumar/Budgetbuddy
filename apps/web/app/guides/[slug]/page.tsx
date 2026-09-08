import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { getGuide, GUIDES } from "@/lib/guides";

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

  return (
    <Container className="py-10">
      <Link href="/guides" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
        &larr; All guides
      </Link>

      <article className="mt-4 max-w-2xl">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{guide.title}</h1>
        <p className="mt-2 text-sm text-slate-500">{guide.description}</p>

        <div className="mt-6 flex flex-col gap-4">
          {guide.body.map((paragraph, i) => (
            <p key={i} className="text-sm leading-relaxed text-slate-700">
              {paragraph}
            </p>
          ))}
        </div>
      </article>
    </Container>
  );
}
