"use client";

import * as React from "react";
import { Loader2, Plus, X, ListPlus } from "lucide-react";
import { toast } from "sonner";

import { trpc } from "@/trpc/react";
import {
  DROPDOWN_CATEGORIES,
  customOnly,
  type DropdownKey,
  type DropdownOptions,
} from "@/lib/dropdowns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type CustomMap = Record<DropdownKey, string[]>;

const emptyMap = () =>
  Object.fromEntries(
    DROPDOWN_CATEGORIES.map((c) => [c.key, []]),
  ) as unknown as CustomMap;

export function DropdownOptionsConfig() {
  const utils = trpc.useUtils();
  const settings = trpc.settings.get.useQuery();
  const save = trpc.settings.updateDropdowns.useMutation();

  const [custom, setCustom] = React.useState<CustomMap>(emptyMap);
  const [drafts, setDrafts] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (!settings.data) return;
    const stored = (settings.data.dropdownOptions ??
      null) as DropdownOptions | null;
    setCustom(
      Object.fromEntries(
        DROPDOWN_CATEGORIES.map((c) => [c.key, customOnly(c.key, stored)]),
      ) as unknown as CustomMap,
    );
  }, [settings.data]);

  function addOption(key: DropdownKey, category: readonly string[]) {
    const value = (drafts[key] ?? "").trim();
    if (!value) return;
    const existing = new Set(
      [...category, ...custom[key]].map((s) => s.toLowerCase()),
    );
    if (existing.has(value.toLowerCase())) {
      toast.error(`"${value}" already exists`);
      return;
    }
    setCustom((prev) => ({ ...prev, [key]: [...prev[key], value] }));
    setDrafts((prev) => ({ ...prev, [key]: "" }));
  }

  function removeOption(key: DropdownKey, value: string) {
    setCustom((prev) => ({
      ...prev,
      [key]: prev[key].filter((o) => o !== value),
    }));
  }

  async function onSave() {
    try {
      await save.mutateAsync({ dropdownOptions: custom });
      await utils.settings.get.invalidate();
      toast.success("Dropdown options updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    }
  }

  if (settings.isLoading) {
    return <Skeleton className="h-96 w-full rounded-xl" />;
  }

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <ListPlus className="size-4 text-primary" />
            Dropdown options
          </CardTitle>
          <CardDescription>
            Add extra choices to the fixed dropdowns used across the app. Built-in
            options can&rsquo;t be removed.
          </CardDescription>
        </div>
        <Button size="sm" onClick={onSave} disabled={save.isPending}>
          {save.isPending && <Loader2 className="size-4 animate-spin" />}
          Save options
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {DROPDOWN_CATEGORIES.map((cat) => (
          <div key={cat.key} className="space-y-2">
            <p className="text-sm font-medium">{cat.label}</p>
            <div className="flex flex-wrap gap-1.5">
              {cat.base.map((o) => (
                <Badge key={o} variant="secondary" className="font-normal">
                  {o}
                </Badge>
              ))}
              {custom[cat.key].map((o) => (
                <Badge
                  key={o}
                  className="gap-1 font-normal"
                  title="Custom option"
                >
                  {o}
                  <button
                    type="button"
                    onClick={() => removeOption(cat.key, o)}
                    className="ml-0.5 rounded-full hover:bg-primary-foreground/20"
                    aria-label={`Remove ${o}`}
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex max-w-sm gap-2">
              <Input
                value={drafts[cat.key] ?? ""}
                onChange={(e) =>
                  setDrafts((prev) => ({ ...prev, [cat.key]: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addOption(cat.key, cat.base);
                  }
                }}
                placeholder={`Add ${cat.label.toLowerCase()}…`}
                className="h-9"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addOption(cat.key, cat.base)}
              >
                <Plus className="size-4" />
                Add
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
