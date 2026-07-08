import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: site.name,
  description: site.description,
  alternates: { canonical: site.url },
  openGraph: {
    type: "website",
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
    url: site.url,
    siteName: site.name,
    images: [
      {
        url: site.ogImage,
        width: 2268,
        height: 2123,
        alt: `${site.name} — ${site.company}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
    images: [site.ogImage],
  },
};

// `proxy.ts` normally handles "/", this is a safety net.
export default function RootPage() {
  redirect("/login");
}
