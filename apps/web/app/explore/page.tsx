import { redirect } from "next/navigation";

/**
 * "Explore" is the nav label for the catalog-browsing experience, which
 * lives at /search (query-param driven filtering). This route exists so
 * /explore itself resolves rather than 404ing for anyone who types or
 * links it directly — it forwards any query string unchanged.
 */
type ExplorePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const resolved = await searchParams;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(resolved)) {
    if (Array.isArray(value)) {
      value.forEach((v) => params.append(key, v));
    } else if (value !== undefined) {
      params.set(key, value);
    }
  }
  const query = params.toString();
  redirect(query ? `/search?${query}` : "/search");
}
