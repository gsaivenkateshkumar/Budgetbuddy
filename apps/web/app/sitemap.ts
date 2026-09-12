import type { MetadataRoute } from "next";
import { GUIDES } from "@/lib/guides";
import { SITE_URL } from "@/lib/siteConfig";

const STATIC_ROUTES = [
  "",
  "/validate",
  "/plan",
  "/tools",
  "/ask",
  "/guides",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/login",
  "/register",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
  }));

  const guideEntries: MetadataRoute.Sitemap = GUIDES.map((guide) => ({
    url: `${SITE_URL}/guides/${guide.slug}`,
    lastModified: new Date(),
  }));

  return [...staticEntries, ...guideEntries];
}
