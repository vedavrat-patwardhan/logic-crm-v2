import type { LucideIcon } from "lucide-react";
import { PageHeader } from "./page-header";
import { EmptyState } from "./empty-state";

export function ModuleStub({
  title,
  description,
  icon,
  capabilities,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  capabilities: string[];
}) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />
      <EmptyState
        icon={icon}
        title={`${title} module`}
        description="This module is being wired up. Planned capabilities:"
      >
        <ul className="mx-auto grid max-w-md gap-1.5 text-left text-sm text-muted-foreground">
          {capabilities.map((c) => (
            <li key={c} className="flex items-start gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
              {c}
            </li>
          ))}
        </ul>
      </EmptyState>
    </div>
  );
}
