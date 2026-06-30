import type { Role, CallStatus, JobStatus } from "@prisma/client";

export const ROLES: Role[] = ["ADMIN", "SALES_ADMIN", "USER"];

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Admin",
  SALES_ADMIN: "Sales Admin",
  USER: "Engineer",
};

export const CALL_STATUS_LABELS: Record<CallStatus, string> = {
  UNALLOCATED: "Unallocated",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
};

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  READY: "Ready",
  DELIVERED: "Delivered",
};

export const PAGE_SIZES = [10, 20, 50] as const;
export const DEFAULT_PAGE_SIZE = 20;

export const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const WEEKDAYS_SHORT = [
  "Su",
  "Mo",
  "Tu",
  "We",
  "Th",
  "Fr",
  "Sa",
] as const;

/** Service-call problem categories (from legacy Collection). */
export const PROBLEM_TYPES = [
  "Quotation",
  "Lead",
  "Assembly & Installation",
  "Attendance Machine",
  "Booting",
  "CCTV",
  "Collection",
  "Delivery",
  "Demo/Training",
  "Display/Monitor",
  "Email/Internet",
  "Network",
  "Laptop",
  "MODEM/Router/Wifi",
  "Other",
  "PC Repair",
  "Preventive Maintenance",
  "Printer/Scanner",
  "Server",
  "Software",
  "Tally/Busy",
  "Toners",
  "UPS",
  "Virus",
  "Firewall",
  "AMC Call",
] as const;

/** Sales-lead categories. */
export const SALES_TYPES = [
  "Quotation",
  "Lead",
  "Demo/Training",
  "Assembly & Installation",
  "AMC Renewal",
  "Other",
] as const;

/** Predefined action remarks. */
export const REMARKS = [
  "Collected",
  "Repaired",
  "Forwarded",
  "Refilled",
  "Installed",
  "Delivered",
] as const;

export const MATERIALS = ["Laptop", "Projector", "Tablet", "Printer"] as const;

export const BRANDS = [
  "HP",
  "Dell",
  "Asus",
  "Lenovo",
  "Apple",
  "BenQ",
  "Acer",
  "Other",
] as const;

export const ACCESSORIES = [
  "Bag",
  "Charger",
  "Power Cord",
  "Mouse",
  "Dongle",
] as const;

export const AMC_FREQUENCIES = [
  "DAILY",
  "WEEKLY",
  "MONTHLY",
  "QUARTERLY",
] as const;
