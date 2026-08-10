"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import type { Role } from "@prisma/client";

import { trpc } from "@/trpc/react";
import { cn } from "@/lib/utils";
import { useAppConfig } from "@/hooks/use-app-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/data/combobox";
import { DatePicker } from "@/components/data/date-picker";
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
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";

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

  const [contacts, setContacts] = React.useState<
    { name: string; email?: string | null; mobile: string[] }[]
  >([]);
  const [contactOpen, setContactOpen] = React.useState(false);
  const contactInputRef = React.useRef<HTMLInputElement | null>(null);

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
      if (c.companyId) {
        void utils.company.byId.fetch({ id: c.companyId }).then((company) => {
          if (company) {
            setContacts(company.contactPerson ?? []);
          }
        });
      } else {
        setContacts([]);
      }
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
      setContacts([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEdit, existing.data, initialAssignee]);

  // Auto-fill address/contact from selected company.
  async function onCompanyChange(companyId: string | null) {
    form.setValue("companyId", companyId);
    if (!companyId) {
      setContacts([]);
      return;
    }
    const company = await utils.company.byId.fetch({ id: companyId });
    if (company) {
      form.setValue("streetAddress", company.streetAddress);
      form.setValue("city", company.city);
      form.setValue("state", company.state);
      form.setValue("pincode", company.pincode);
      setContacts(company.contactPerson ?? []);
      const first = company.contactPerson[0];
      if (first) {
        form.setValue("contactPerson", first.name);
        form.setValue("email", first.email ?? "");
        form.setValue("mobile", (first.mobile ?? []).join(", "));
      }
    }
  }

  const contactPersonValue = form.watch("contactPerson");

  const contactSuggestions = React.useMemo(() => {
    const q = (contactPersonValue ?? "").toLowerCase().trim();
    if (!q) return contacts;
    const exactMatch = contacts.some((c) => c.name.toLowerCase() === q);
    if (exactMatch) return contacts;
    return contacts.filter((c) => c.name.toLowerCase().includes(q));
  }, [contacts, contactPersonValue]);

  function selectContact(c: {
    name: string;
    email?: string | null;
    mobile: string[];
  }) {
    form.setValue("contactPerson", c.name, { shouldValidate: true });
    form.setValue("email", c.email ?? "");
    form.setValue("mobile", (c.mobile ?? []).join(", "));
    setContactOpen(false);
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
                  <Popover open={contactOpen} onOpenChange={setContactOpen}>
                    <PopoverAnchor asChild>
                      <FormControl>
                        <Input
                          placeholder="Name"
                          autoComplete="off"
                          {...field}
                          ref={(el) => {
                            field.ref(el);
                            contactInputRef.current = el;
                          }}
                          onChange={(e) => {
                            field.onChange(e);
                            if (contacts.length > 0) setContactOpen(true);
                          }}
                          onFocus={() => {
                            if (contacts.length > 0) setContactOpen(true);
                          }}
                          onClick={() => {
                            if (contacts.length > 0) setContactOpen(true);
                          }}
                        />
                      </FormControl>
                    </PopoverAnchor>
                    {contactSuggestions.length > 0 ? (
                      <PopoverContent
                        align="start"
                        className="w-[--radix-popover-trigger-width] p-1"
                        onOpenAutoFocus={(e) => e.preventDefault()}
                        onInteractOutside={(e) => {
                          // Clicking the anchor input must not dismiss the
                          // popover, or it flickers closed on focus click.
                          if (
                            e.target instanceof Node &&
                            contactInputRef.current?.contains(e.target)
                          ) {
                            e.preventDefault();
                          }
                        }}
                      >
                        <div className="max-h-56 overflow-y-auto">
                          {contactSuggestions.map((c, i) => (
                            <button
                              key={`${c.name}-${i}`}
                              type="button"
                              onClick={() => selectContact(c)}
                              className={cn(
                                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent",
                              )}
                            >
                              <Check
                                className={cn(
                                  "size-4 shrink-0",
                                  c.name === field.value
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                              <span className="truncate">
                                {c.name}
                                {c.mobile[0] ? (
                                  <span className="text-muted-foreground">
                                    {" · "}
                                    {c.mobile[0]}
                                  </span>
                                ) : null}
                              </span>
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    ) : null}
                  </Popover>
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
                <FormItem className="flex flex-col">
                  <FormLabel>Start date</FormLabel>
                  <DatePicker
                    value={field.value ? parseISO(field.value) : null}
                    onChange={(d) =>
                      field.onChange(d ? format(d, "yyyy-MM-dd") : "")
                    }
                    placeholder="Select start date"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="expClosure"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Expected closure</FormLabel>
                  <DatePicker
                    value={field.value ? parseISO(field.value) : null}
                    onChange={(d) =>
                      field.onChange(d ? format(d, "yyyy-MM-dd") : "")
                    }
                    placeholder="Select expected closure"
                  />
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
