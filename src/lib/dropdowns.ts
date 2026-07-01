import {
  PROBLEM_TYPES,
  SALES_TYPES,
  REMARKS,
  MATERIALS,
  BRANDS,
  ACCESSORIES,
} from "./constants";

/**
 * Fixed dropdowns that admins can extend with extra options via
 * Settings → Dropdown Options. Base values ship in constants.ts; custom
 * additions are stored in AppSetting.dropdownOptions.
 */
export const DROPDOWN_CATEGORIES = [
  { key: "problemTypes", label: "Call problem types", base: [...PROBLEM_TYPES] },
  { key: "salesTypes", label: "Sales lead types", base: [...SALES_TYPES] },
  { key: "remarks", label: "Action remarks", base: [...REMARKS] },
  { key: "materials", label: "Job card materials", base: [...MATERIALS] },
  { key: "brands", label: "Job card brands", base: [...BRANDS] },
  { key: "accessories", label: "Job card accessories", base: [...ACCESSORIES] },
] as const;

export type DropdownKey = (typeof DROPDOWN_CATEGORIES)[number]["key"];
export type DropdownOptions = Partial<Record<DropdownKey, string[]>>;

const BASE = Object.fromEntries(
  DROPDOWN_CATEGORIES.map((c) => [c.key, [...c.base]]),
) as unknown as Record<DropdownKey, string[]>;

/** Base options followed by custom additions (case-insensitive dedupe, order preserved). */
export function mergeOptions(
  key: DropdownKey,
  custom?: DropdownOptions | null,
): string[] {
  const base = BASE[key] ?? [];
  const extra = custom?.[key] ?? [];
  const seen = new Set(base.map((s) => s.toLowerCase()));
  const merged = [...base];
  for (const o of extra) {
    const v = o?.trim();
    if (v && !seen.has(v.toLowerCase())) {
      seen.add(v.toLowerCase());
      merged.push(v);
    }
  }
  return merged;
}

/** Just the custom additions for a category (not in the base set). */
export function customOnly(
  key: DropdownKey,
  custom?: DropdownOptions | null,
): string[] {
  const base = new Set((BASE[key] ?? []).map((s) => s.toLowerCase()));
  return (custom?.[key] ?? []).filter(
    (o) => o?.trim() && !base.has(o.trim().toLowerCase()),
  );
}
