"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Role } from "@prisma/client";

import { trpc } from "@/trpc/react";
import { useAppConfig } from "@/hooks/use-app-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/data/combobox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const schema = z.object({
  companyId: z.string().nullable().optional(),
  contactPerson: z.string().optional(),
  email: z.string().email("Invalid email").or(z.literal("")).optional(),
  mobile: z.string().optional(),
  streetAddress: z.string().min(1, "Required"),
  city: z.string().min(1, "Required"),
  state: z.string().min(1, "Required"),
  pincode: z.string().min(1, "Required"),
  assignedEmployeeId: z.string().min(1, "Assign an employee"),
  problemType: z.string().min(1, "Required"),
  callDescription: z.string().optional(),
  startDate: z.string().min(1, "Required"),
  expClosure: z.string().min(1, "Required"),
});
type Values = z.infer<typeof schema>;

function toDateInput(d: Date | string): string {
  return new Date(d).toISOString().slice(0, 10);
}

export function CallFormDialog({
  open,
  onOpenChange,
  kind,
  editId,
  role,
  userId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  kind: "service" | "sales";
  editId: string | null;
  role: Role;
  userId: string;
}) {
  const utils = trpc.useUtils();
  const isEdit = !!editId;
  const isUser = role === "USER";
  const { defaultAssigneeId, options } = useAppConfig();
  const initialAssignee = isUser ? userId : defaultAssigneeId ?? "";

  const companyOptions = trpc.company.options.useQuery(undefined, {
    enabled: open,
  });
  const userOptions = trpc.user.options.useQuery(undefined, { enabled: open });
  const existing = trpc.calls.byId.useQuery(
    { id: editId! },
    { enabled: open && isEdit },
  );

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      companyId: null,
      contactPerson: "",
      email: "",
      mobile: "",
      streetAddress: "",
      city: "",
      state: "",
      pincode: "",
      assignedEmployeeId: initialAssignee,
      problemType: "",
      callDescription: "",
      startDate: toDateInput(new Date()),
      expClosure: toDateInput(new Date(Date.now() + 86400000)),
    },
  });

  // Prefill when editing.
  React.useEffect(() => {
    if (open && isEdit && existing.data) {
      const c = existing.data;
      form.reset({
        companyId: c.companyId ?? null,
        contactPerson: c.contactPerson ?? "",
        email: c.email ?? "",
        mobile: (c.mobile ?? []).join(", "),
        streetAddress: c.streetAddress,
        city: c.city,
        state: c.state,
        pincode: c.pincode,
        assignedEmployeeId: c.assignedEmployeeId,
        problemType: c.problemType,
        callDescription: c.callDescription ?? "",
        startDate: toDateInput(c.startDate),
        expClosure: toDateInput(c.expClosure),
      });
    }
    if (open && !isEdit) {
      form.reset({
        companyId: null,
        contactPerson: "",
        email: "",
        mobile: "",
        streetAddress: "",
        city: "",
        state: "",
        pincode: "",
        assignedEmployeeId: initialAssignee,
        problemType: "",
        callDescription: "",
        startDate: toDateInput(new Date()),
        expClosure: toDateInput(new Date(Date.now() + 86400000)),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEdit, existing.data, initialAssignee]);

  // Auto-fill address/contact from selected company.
  async function onCompanyChange(companyId: string | null) {
    form.setValue("companyId", companyId);
    if (!companyId) return;
    const company = await utils.company.byId.fetch({ id: companyId });
    if (company) {
      form.setValue("streetAddress", company.streetAddress);
      form.setValue("city", company.city);
      form.setValue("state", company.state);
      form.setValue("pincode", company.pincode);
      const first = company.contactPerson[0];
      if (first) {
        form.setValue("contactPerson", first.name);
        form.setValue("email", first.email ?? "");
        form.setValue("mobile", (first.mobile ?? []).join(", "));
      }
    }
  }

  const createMut = trpc.calls.create.useMutation();
  const updateMut = trpc.calls.update.useMutation();
  const saving = createMut.isPending || updateMut.isPending;

  async function onSubmit(values: Values) {
    const payload = {
      companyId: values.companyId || null,
      contactPerson: values.contactPerson || null,
      email: values.email || "",
      mobile: (values.mobile ?? "")
        .split(",")
        .map((m) => m.trim())
        .filter(Boolean),
      streetAddress: values.streetAddress,
      city: values.city,
      state: values.state,
      pincode: values.pincode,
      assignedEmployeeId: values.assignedEmployeeId,
      problemType: values.problemType,
      callDescription: values.callDescription || null,
      startDate: new Date(values.startDate),
      expClosure: new Date(values.expClosure),
      isSales: kind === "sales",
    };
    try {
      if (isEdit) {
        await updateMut.mutateAsync({ id: editId!, ...payload });
        toast.success("Call updated");
      } else {
        const res = await createMut.mutateAsync(payload);
        toast.success(`Call ${res.ticketNo} created`);
      }
      await utils.calls.list.invalidate();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  const problemOptions = options(
    kind === "sales" ? "salesTypes" : "problemTypes",
  ).map((p) => ({ value: p, label: p }));
  const noun = kind === "sales" ? "Lead" : "Call";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? `Edit ${noun}` : `New ${noun}`}
          </DialogTitle>
          <DialogDescription>
            {kind === "sales"
              ? "Capture a sales lead and assign an owner."
              : "Log a service call and assign an engineer."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-4 sm:grid-cols-2"
          >
            {!isUser && (
              <FormField
                control={form.control}
                name="companyId"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Company</FormLabel>
                    <Combobox
                      options={(companyOptions.data ?? []).map((c) => ({
                        value: c.id,
                        label: c.name,
                      }))}
                      value={field.value}
                      onChange={onCompanyChange}
                      placeholder="Select company (optional)"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="contactPerson"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact person</FormLabel>
                  <FormControl>
                    <Input placeholder="Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="mobile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile</FormLabel>
                  <FormControl>
                    <Input placeholder="Comma separated" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="contact@company.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="streetAddress"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Street address</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="pincode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pincode</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="problemType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{kind === "sales" ? "Lead type" : "Problem type"}</FormLabel>
                  <Combobox
                    options={problemOptions}
                    value={field.value}
                    onChange={(v) => field.onChange(v ?? "")}
                    placeholder="Select"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isUser && (
              <FormField
                control={form.control}
                name="assignedEmployeeId"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Assigned to</FormLabel>
                    <Combobox
                      options={(userOptions.data ?? []).map((u) => ({
                        value: u.id,
                        label: u.name,
                      }))}
                      value={field.value}
                      onChange={(v) => field.onChange(v ?? "")}
                      placeholder="Select employee"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="expClosure"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expected closure</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="callDescription"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="sm:col-span-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="size-4 animate-spin" />}
                {isEdit ? "Save changes" : `Create ${noun.toLowerCase()}`}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
