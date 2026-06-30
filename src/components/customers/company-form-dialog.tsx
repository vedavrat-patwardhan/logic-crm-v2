"use client";

import * as React from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { trpc } from "@/trpc/react";
import { WEEKDAYS, AMC_FREQUENCIES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const FREQ_VALUES = ["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY"] as const;

const contactSchema = z.object({
  name: z.string().min(1, "Required"),
  email: z.string().email("Invalid email").or(z.literal("")).optional(),
  mobile: z.string().optional(),
});

const amcSchema = z.object({
  frequency: z.enum(FREQ_VALUES),
  dayOfWeek: z.string().optional(),
  weekOfMonth: z.string().optional(),
  monthOfQuarter: z.string().optional(),
  employeeId: z.string().nullable().optional(),
});

const schema = z.object({
  name: z.string().min(1, "Required"),
  streetAddress: z.string().min(1, "Required"),
  city: z.string().min(1, "Required"),
  state: z.string().min(1, "Required"),
  pincode: z.string().min(1, "Required"),
  contactPerson: z.array(contactSchema),
  hasAmc: z.boolean(),
  amc: z.array(amcSchema),
});
type Values = z.infer<typeof schema>;

const EMPTY: Values = {
  name: "",
  streetAddress: "",
  city: "",
  state: "",
  pincode: "",
  contactPerson: [{ name: "", email: "", mobile: "" }],
  hasAmc: false,
  amc: [],
};

const WEEK_OPTIONS = [
  { value: "1", label: "1st week" },
  { value: "2", label: "2nd week" },
  { value: "3", label: "3rd week" },
  { value: "4", label: "4th week" },
];

const MONTH_OF_QUARTER_OPTIONS = [
  { value: "1", label: "1st month" },
  { value: "2", label: "2nd month" },
  { value: "3", label: "3rd month" },
];

export function CompanyFormDialog({
  open,
  onOpenChange,
  editId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editId: string | null;
}) {
  const utils = trpc.useUtils();
  const isEdit = !!editId;

  const userOptions = trpc.user.options.useQuery(undefined, { enabled: open });
  const existing = trpc.company.byId.useQuery(
    { id: editId! },
    { enabled: open && isEdit },
  );

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY,
  });

  const contacts = useFieldArray({
    control: form.control,
    name: "contactPerson",
  });
  const amc = useFieldArray({ control: form.control, name: "amc" });

  const hasAmc = form.watch("hasAmc");

  // Prefill when editing / reset when creating.
  React.useEffect(() => {
    if (open && isEdit && existing.data) {
      const c = existing.data;
      form.reset({
        name: c.name,
        streetAddress: c.streetAddress,
        city: c.city,
        state: c.state,
        pincode: c.pincode,
        contactPerson:
          c.contactPerson.length > 0
            ? c.contactPerson.map((p) => ({
                name: p.name,
                email: p.email ?? "",
                mobile: (p.mobile ?? []).join(", "),
              }))
            : [{ name: "", email: "", mobile: "" }],
        hasAmc: c.hasAmc,
        amc: (c.amc ?? []).map((a) => ({
          frequency: a.frequency,
          dayOfWeek: a.dayOfWeek != null ? String(a.dayOfWeek) : undefined,
          weekOfMonth: a.weekOfMonth != null ? String(a.weekOfMonth) : undefined,
          monthOfQuarter:
            a.monthOfQuarter != null ? String(a.monthOfQuarter) : undefined,
          employeeId: a.employeeId ?? null,
        })),
      });
    }
    if (open && !isEdit) {
      form.reset(EMPTY);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEdit, existing.data]);

  const createMut = trpc.company.create.useMutation();
  const updateMut = trpc.company.update.useMutation();
  const saving = createMut.isPending || updateMut.isPending;

  async function onSubmit(values: Values) {
    const payload = {
      name: values.name,
      streetAddress: values.streetAddress,
      city: values.city,
      state: values.state,
      pincode: values.pincode,
      contactPerson: values.contactPerson.map((p) => ({
        name: p.name,
        email: p.email ?? "",
        mobile: (p.mobile ?? "")
          .split(",")
          .map((m) => m.trim())
          .filter(Boolean),
      })),
      hasAmc: values.hasAmc,
      amc: values.hasAmc
        ? values.amc.map((a) => ({
            frequency: a.frequency,
            dayOfWeek:
              a.frequency !== "DAILY" && a.dayOfWeek != null && a.dayOfWeek !== ""
                ? Number(a.dayOfWeek)
                : null,
            weekOfMonth:
              (a.frequency === "MONTHLY" || a.frequency === "QUARTERLY") &&
              a.weekOfMonth != null &&
              a.weekOfMonth !== ""
                ? Number(a.weekOfMonth)
                : null,
            monthOfQuarter:
              a.frequency === "QUARTERLY" &&
              a.monthOfQuarter != null &&
              a.monthOfQuarter !== ""
                ? Number(a.monthOfQuarter)
                : null,
            employeeId: a.employeeId || null,
          }))
        : [],
    };
    try {
      if (isEdit) {
        await updateMut.mutateAsync({ id: editId!, ...payload });
        toast.success("Customer updated");
      } else {
        await createMut.mutateAsync(payload);
        toast.success("Customer created");
      }
      await utils.company.list.invalidate();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  const employeeOptions = (userOptions.data ?? []).map((u) => ({
    value: u.id,
    label: u.name,
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit customer" : "New customer"}</DialogTitle>
          <DialogDescription>
            Company details, contacts and AMC scheduling.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Company name</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
            </div>

            <Separator />

            {/* Contacts */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Contacts</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    contacts.append({ name: "", email: "", mobile: "" })
                  }
                >
                  <Plus className="size-4" />
                  Add contact
                </Button>
              </div>

              <div className="space-y-3">
                {contacts.fields.map((cf, index) => (
                  <div
                    key={cf.id}
                    className="rounded-lg border bg-muted/30 p-3"
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name={`contactPerson.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Contact name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`contactPerson.${index}.mobile`}
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
                        name={`contactPerson.${index}.email`}
                        render={({ field }) => (
                          <FormItem className="sm:col-span-2">
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="contact@company.com"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    {contacts.fields.length > 1 && (
                      <div className="mt-3 flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => contacts.remove(index)}
                        >
                          <Trash2 className="size-4" />
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* AMC scheduling */}
            <div className="space-y-3">
              <FormField
                control={form.control}
                name="hasAmc"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between gap-4 space-y-0 rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>AMC scheduling</FormLabel>
                      <p className="text-xs text-muted-foreground">
                        Enable to generate recurring AMC service calls.
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        aria-label="AMC scheduling"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {hasAmc && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">AMC schedules</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        amc.append({
                          frequency: "MONTHLY",
                          dayOfWeek: undefined,
                          weekOfMonth: undefined,
                          monthOfQuarter: undefined,
                          employeeId: null,
                        })
                      }
                    >
                      <Plus className="size-4" />
                      Add schedule
                    </Button>
                  </div>

                  {amc.fields.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No schedules yet. Add one to define when AMC calls
                      generate.
                    </p>
                  )}

                  {amc.fields.map((af, index) => {
                    const freq = form.watch(`amc.${index}.frequency`);
                    return (
                      <div
                        key={af.id}
                        className="rounded-lg border bg-muted/30 p-3"
                      >
                        <div className="grid gap-3 sm:grid-cols-2">
                          <FormField
                            control={form.control}
                            name={`amc.${index}.frequency`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Frequency</FormLabel>
                                <Select
                                  value={field.value}
                                  onValueChange={field.onChange}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {AMC_FREQUENCIES.map((f) => (
                                      <SelectItem key={f} value={f}>
                                        {f.charAt(0) + f.slice(1).toLowerCase()}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {freq !== "DAILY" && (
                            <FormField
                              control={form.control}
                              name={`amc.${index}.dayOfWeek`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Day of week</FormLabel>
                                  <Select
                                    value={field.value ?? ""}
                                    onValueChange={field.onChange}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select day" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {WEEKDAYS.map((d, i) => (
                                        <SelectItem key={d} value={String(i)}>
                                          {d}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}

                          {(freq === "MONTHLY" || freq === "QUARTERLY") && (
                            <FormField
                              control={form.control}
                              name={`amc.${index}.weekOfMonth`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Week of month</FormLabel>
                                  <Select
                                    value={field.value ?? ""}
                                    onValueChange={field.onChange}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select week" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {WEEK_OPTIONS.map((w) => (
                                        <SelectItem key={w.value} value={w.value}>
                                          {w.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}

                          {freq === "QUARTERLY" && (
                            <FormField
                              control={form.control}
                              name={`amc.${index}.monthOfQuarter`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Month of quarter</FormLabel>
                                  <Select
                                    value={field.value ?? ""}
                                    onValueChange={field.onChange}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select month" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {MONTH_OF_QUARTER_OPTIONS.map((m) => (
                                        <SelectItem key={m.value} value={m.value}>
                                          {m.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}

                          <Controller
                            control={form.control}
                            name={`amc.${index}.employeeId`}
                            render={({ field }) => (
                              <FormItem className="sm:col-span-2">
                                <FormLabel>Assigned employee</FormLabel>
                                <Combobox
                                  options={employeeOptions}
                                  value={field.value}
                                  onChange={field.onChange}
                                  placeholder="Select employee (optional)"
                                />
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="mt-3 flex justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => amc.remove(index)}
                          >
                            <Trash2 className="size-4" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="size-4 animate-spin" />}
                {isEdit ? "Save changes" : "Create customer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
