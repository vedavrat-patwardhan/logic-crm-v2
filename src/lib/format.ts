import { format, formatDistanceToNow, isValid } from "date-fns";

export function formatDate(date?: Date | string | number | null): string {
  if (!date) return "—";
  const d = new Date(date);
  return isValid(d) ? format(d, "dd MMM yyyy") : "—";
}

export function formatDateTime(date?: Date | string | number | null): string {
  if (!date) return "—";
  const d = new Date(date);
  return isValid(d) ? format(d, "dd MMM yyyy, h:mm a") : "—";
}

export function formatRelative(date?: Date | string | number | null): string {
  if (!date) return "—";
  const d = new Date(date);
  return isValid(d) ? formatDistanceToNow(d, { addSuffix: true }) : "—";
}

export function initials(name?: string | null): string {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function formatPhone(mobile?: string[] | string | null): string {
  if (!mobile) return "—";
  return Array.isArray(mobile) ? mobile.filter(Boolean).join(", ") : mobile;
}

/** "20260630" → "30 Jun 2026" for ticket numbers. */
export function ticketDateLabel(ticketNo: string): string {
  const m = ticketNo.match(/^(\d{4})(\d{2})(\d{2})/);
  if (!m) return ticketNo;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return isValid(d) ? format(d, "dd MMM yyyy") : ticketNo;
}
