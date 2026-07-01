"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, UserPlus, Check } from "lucide-react";
import { toast } from "sonner";

import { trpc } from "@/trpc/react";
import { cn } from "@/lib/utils";
import { useAppConfig } from "@/hooks/use-app-config";
import { JOB_STATUS_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const STATUSES = Object.keys(JOB_STATUS_LABELS) as Array<
  keyof typeof JOB_STATUS_LABELS
>;

const schema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  companyName: z.string().optional(),
  mobileNo: z.string().optional(),
  material: z.string().optional(),
  brand: z.string().optional(),
  modelNo: z.string().optional(),
  srNo: z.string().optional(),
  password: z.string().optional(),
  problem: z.string().optional(),
  estimate: z.string().optional(),
  accessories: z.array(z.string()),
  receivedBy: z.string().min(1, "Received by is required"),
  repairedBy: z.string().optional(),
  remark: z.string().optional(),
  status: z.enum(["PENDING", "IN_PROGRESS", "READY", "DELIVERED"]),
});
type Values = z.infer<typeof schema>;

const EMPTY: Values = {
  customerName: "",
  companyName: "",
  mobileNo: "",
  material: "",
  brand: "",
  modelNo: "",
  srNo: "",
  password: "",
  problem: "",
  estimate: "",
  accessories: [],
  receivedBy: "",
  repairedBy: "",
  remark: "",
  status: "PENDING",
};

export function JobCardFormDialog({
  open,
  onOpenChange,
  editId,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editId: string | null;
  onCreated?: (job: {
    jobNo: string;
    date: Date | string;
    customerName: string;
  }) => void;
}) {
  const utils = trpc.useUtils();
  const isEdit = !!editId;
  const { options } = useAppConfig();
  const materials = options("materials");
  const brands = options("brands");
  const accessories = options("accessories");

  const customers = trpc.jobcard.customers.useQuery(undefined, {
    enabled: open,
  });
  const existing = trpc.jobcard.byId.useQuery(
    { id: editId! },
    { enabled: open && isEdit },
  );

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY,
  });

  // Track whether the entered customer matches a saved contact.
  const [suggestOpen, setSuggestOpen] = React.useState(false);
  const customerName = form.watch("customerName");

  React.useEffect(() => {
    if (open && isEdit && existing.data) {
      const j = existing.data;
      form.reset({
        customerName: j.customerName,
        companyName: j.companyName ?? "",
        mobileNo: j.mobileNo ?? "",
        material: j.material ?? "",
        brand: j.brand ?? "",
        modelNo: j.modelNo ?? "",
        srNo: j.srNo ?? "",
        password: j.password ?? "",
        problem: j.problem ?? "",
        estimate: j.estimate ?? "",
        accessories: j.accessories ?? [],
        receivedBy: j.receivedBy ?? "",
        repairedBy: j.repairedBy ?? "",
        remark: j.remark ?? "",
        status: j.status,
      });
    }
    if (open && !isEdit) {
      form.reset(EMPTY);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEdit, existing.data]);

  const knownNames = React.useMemo(
    () =>
      new Set(
        (customers.data ?? []).map((c) => c.customerName.toLowerCase().trim()),
      ),
    [customers.data],
  );
  const isNewCustomer =
    !!customerName.trim() && !knownNames.has(customerName.toLowerCase().trim());

  const suggestions = React.useMemo(() => {
    const q = customerName.toLowerCase().trim();
    const list = customers.data ?? [];
    if (!q) return list.slice(0, 8);
    return list
      .filter(
        (c) =>
          c.customerName.toLowerCase().includes(q) ||
          (c.companyName ?? "").toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [customers.data, customerName]);

  function selectCustomer(c: {
    customerName: string;
    companyName: string | null;
    mobileNo: string | null;
  }) {
    form.setValue("customerName", c.customerName, { shouldValidate: true });
    form.setValue("companyName", c.companyName ?? "");
    form.setValue("mobileNo", c.mobileNo ?? "");
    setSuggestOpen(false);
  }

  const createMut = trpc.jobcard.create.useMutation();
  const updateMut = trpc.jobcard.update.useMutation();
  const addCustomerMut = trpc.jobcard.addCustomer.useMutation();
  const saving = createMut.isPending || updateMut.isPending;

  async function saveContact() {
    const name = form.getValues("customerName").trim();
    if (!name) {
      toast.error("Enter a customer name first");
      return;
    }
    try {
      await addCustomerMut.mutateAsync({
        customerName: name,
        companyName: form.getValues("companyName") || null,
        mobileNo: form.getValues("mobileNo") || null,
      });
      toast.success("Contact saved");
      await utils.jobcard.customers.invalidate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save contact");
    }
  }

  async function onSubmit(values: Values) {
    const payload = {
      customerName: values.customerName.trim(),
      companyName: values.companyName?.trim() || null,
      mobileNo: values.mobileNo?.trim() || null,
      material: values.material || null,
      accessories: values.accessories,
      brand: values.brand || null,
      modelNo: values.modelNo?.trim() || null,
      srNo: values.srNo?.trim() || null,
      password: values.password?.trim() || null,
      problem: values.problem?.trim() || null,
      estimate: values.estimate?.trim() || null,
      receivedBy: values.receivedBy.trim(),
      repairedBy: values.repairedBy?.trim() || null,
      remark: values.remark?.trim() || null,
      status: values.status,
    };
    try {
      if (isEdit) {
        await updateMut.mutateAsync({ id: editId!, ...payload });
        toast.success("Job card updated");
      } else {
        const res = await createMut.mutateAsync(payload);
        toast.success(`Job card ${res.jobNo} created`);
        onCreated?.({
          jobNo: res.jobNo,
          date: res.date,
          customerName: res.customerName,
        });
      }
      await utils.jobcard.list.invalidate();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  function toggleAccessory(item: string) {
    const current = form.getValues("accessories");
    form.setValue(
      "accessories",
      current.includes(item)
        ? current.filter((a) => a !== item)
        : [...current, item],
      { shouldDirty: true },
    );
  }

  const selectedAccessories = form.watch("accessories");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit job card" : "New job card"}</DialogTitle>
          <DialogDescription>
            Capture device intake details and assign a status.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-4 sm:grid-cols-2"
          >
            {/* Customer typeahead */}
            <FormField
              control={form.control}
              name="customerName"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Customer name</FormLabel>
                  <Popover open={suggestOpen} onOpenChange={setSuggestOpen}>
                    <PopoverAnchor asChild>
                      <FormControl>
                        <Input
                          placeholder="Type to search or add a customer"
                          autoComplete="off"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            setSuggestOpen(true);
                          }}
                          onFocus={() => setSuggestOpen(true)}
                        />
                      </FormControl>
                    </PopoverAnchor>
                    {suggestions.length > 0 ? (
                      <PopoverContent
                        align="start"
                        className="w-[--radix-popover-trigger-width] p-1"
                        onOpenAutoFocus={(e) => e.preventDefault()}
                      >
                        <div className="max-h-56 overflow-y-auto">
                          {suggestions.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => selectCustomer(c)}
                              className={cn(
                                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent",
                              )}
                            >
                              <Check
                                className={cn(
                                  "size-4 shrink-0",
                                  c.customerName === field.value
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                              <span className="truncate">
                                {c.customerName}
                                {c.companyName ? (
                                  <span className="text-muted-foreground">
                                    {" · "}
                                    {c.companyName}
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
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company</FormLabel>
                  <FormControl>
                    <Input placeholder="Company name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="mobileNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile</FormLabel>
                  <FormControl>
                    <Input placeholder="Mobile number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isNewCustomer ? (
              <div className="sm:col-span-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={saveContact}
                  disabled={addCustomerMut.isPending}
                >
                  {addCustomerMut.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <UserPlus className="size-4" />
                  )}
                  Save contact
                </Button>
              </div>
            ) : null}

            {/* Device details */}
            <FormField
              control={form.control}
              name="material"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Material</FormLabel>
                  <Select
                    value={field.value || undefined}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select material" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {materials.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="brand"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand</FormLabel>
                  <Select
                    value={field.value || undefined}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select brand" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {brands.map((b) => (
                        <SelectItem key={b} value={b}>
                          {b}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="modelNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Model No</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="srNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Serial No</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input placeholder="Device password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="estimate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estimate</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 2500" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Accessories */}
            <FormItem className="sm:col-span-2">
              <FormLabel>Accessories</FormLabel>
              <div className="flex flex-wrap gap-2">
                {accessories.map((item) => {
                  const active = selectedAccessories.includes(item);
                  return (
                    <Badge
                      key={item}
                      role="button"
                      tabIndex={0}
                      aria-pressed={active}
                      onClick={() => toggleAccessory(item)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          toggleAccessory(item);
                        }
                      }}
                      variant={active ? "default" : "outline"}
                      className="cursor-pointer select-none"
                    >
                      {active ? <Check className="size-3" /> : null}
                      {item}
                    </Badge>
                  );
                })}
              </div>
            </FormItem>

            <FormField
              control={form.control}
              name="problem"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Problem</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Describe the reported problem"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Handling */}
            <FormField
              control={form.control}
              name="receivedBy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Received by</FormLabel>
                  <FormControl>
                    <Input placeholder="Staff name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="repairedBy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Repaired by</FormLabel>
                  <FormControl>
                    <Input placeholder="Technician name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {JOB_STATUS_LABELS[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="remark"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Remark</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
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
                {isEdit ? "Save changes" : "Create job card"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
