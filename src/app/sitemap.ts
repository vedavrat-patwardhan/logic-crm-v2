import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${site.url}/login`,
      changeFrequency: "yearly",
      priority: 0.5,
    },
  ];
}
