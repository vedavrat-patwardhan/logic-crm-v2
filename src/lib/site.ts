import type { Metadata } from "next";

/** Public site metadata — used for SEO, Open Graph, and manifests. */
export const site = {
  name: "Logic CRM",
  company: "Logic Systems",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "https://crm.logicnsk.com",
  description:
    "Logic CRM — manage service calls, customers, AMC scheduling, job cards, sales and analytics for Logic Systems.",
  tagline: "Service operations, unified.",
  locale: "en_IN",
  email: "enquiry@logicsys.in",
  /** 1200×630 — WhatsApp / Facebook recommended aspect ratio. */
  ogImage: "/og.jpg",
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogImageType: "image/jpeg",
} as const;

/** Shared Open Graph image metadata for public pages. */
export function ogImages(): NonNullable<Metadata["openGraph"]>["images"] {
  return [
    {
      url: site.ogImage,
      width: site.ogImageWidth,
      height: site.ogImageHeight,
      type: site.ogImageType,
      alt: `${site.name} — ${site.company}`,
    },
  ];
}
