import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.name,
    short_name: "Logic CRM",
    description: site.description,
    start_url: "/login",
    display: "standalone",
    background_color: "#F8FAFC",
    theme_color: "#0F172A",
    lang: "en-IN",
    orientation: "any",
    icons: [
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
