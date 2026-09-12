import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { GUIDES } from "@/lib/guides";

export function GuidesPreview() {
  const featured = GUIDES.slice(0, 3);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Business guides</h2>
        <Link href="/guides" className="text-sm font-medium text-violet-600 hover:text-violet-700">
          View all &rarr;
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {featured.map((guide) => (
          <Card key={guide.slug} hover className="p-5">
            <Link href={`/guides/${guide.slug}`} className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold text-slate-900">{guide.title}</h3>
              <p className="text-sm text-slate-600">{guide.description}</p>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
