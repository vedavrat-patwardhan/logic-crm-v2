"use client";

import { trpc } from "@/trpc/react";
import {
  mergeOptions,
  type DropdownKey,
  type DropdownOptions,
} from "@/lib/dropdowns";

/**
 * Client access to admin-configured application defaults: the default call
 * assignee and any custom dropdown options.
 */
export function useAppConfig() {
  const { data } = trpc.settings.get.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });

  const dropdownOptions = (data?.dropdownOptions ??
    null) as DropdownOptions | null;

  return {
    defaultAssigneeId: data?.defaultAssigneeId ?? null,
    /** Base + custom options for a fixed dropdown. */
    options: (key: DropdownKey) => mergeOptions(key, dropdownOptions),
  };
}
