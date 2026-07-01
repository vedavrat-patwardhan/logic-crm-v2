"use client";

import { PageHeader } from "@/components/app/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccessControl } from "./access-control";

export function SettingsView() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Configure access control and application defaults."
      />

      <Tabs defaultValue="access" className="space-y-4">
        <TabsList>
          <TabsTrigger value="access">Access Control</TabsTrigger>
        </TabsList>

        <TabsContent value="access">
          <AccessControl />
        </TabsContent>
      </Tabs>
    </div>
  );
}
