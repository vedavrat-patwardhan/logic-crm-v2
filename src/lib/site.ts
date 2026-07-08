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
} as const;
