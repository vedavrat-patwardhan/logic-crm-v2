import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

/** Private app — keep authenticated CRM pages out of search indexes. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: ["/api/", "/calls", "/customers", "/job-cards", "/sales", "/reports", "/analytics", "/users", "/settings", "/profile"],
      allow: ["/login"],
    },
    host: site.url,
  };
}
