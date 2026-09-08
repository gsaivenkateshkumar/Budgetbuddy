import type { MetadataRoute } from "next";
import { listProducts } from "@/lib/api/products";
import { SITE_URL } from "@/lib/siteConfig";

const STATIC_ROUTES = ["", "/search", "/compare", "/ask", "/login", "/register"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
  }));

  try {
    const { items } = await listProducts({ page_size: 100 });
    const productEntries: MetadataRoute.Sitemap = items.map((product) => ({
      url: `${SITE_URL}/products/${product.slug}`,
      lastModified: new Date(),
    }));
    return [...staticEntries, ...productEntries];
  } catch {
    // API unreachable at build/request time — ship the static routes only
    // rather than failing the whole sitemap.
    return staticEntries;
  }
}
