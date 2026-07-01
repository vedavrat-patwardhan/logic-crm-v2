"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

import { trpc } from "@/trpc/react";
import { ROLES, ROLE_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  FormDescription,
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
import type { UserRow } from "./users-view";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email address"),
  password: z.string(),
  dob: z.string().optional(),
  mobile: z.string().optional(),
  role: z.enum(["ADMIN", "SALES_ADMIN", "USER"]),
});
type Values = z.infer<typeof schema>;

function toDateInput(d: Date | string | null | undefined): string {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

const EMPTY: Values = {
  name: "",
  email: "",
  password: "",
  dob: "",
  mobile: "",
  role: "USER",
};

export function UserFormDialog({
  open,
  onOpenChange,
  editId,
  initial,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editId: string | null;
  initial?: UserRow | null;
}) {
  const utils = trpc.useUtils();
  const isEdit = !!editId;
  const [showPassword, setShowPassword] = React.useState(false);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY,
  });

  // Prefill / reset when the dialog opens.
  React.useEffect(() => {
    if (!open) return;
    setShowPassword(false);
    if (isEdit && initial) {
      form.reset({
        name: initial.name,
        email: initial.email,
        password: "",
        dob: toDateInput(initial.dob),
        mobile: (initial.mobileNo ?? []).join(", "),
        role: initial.role,
      });
    } else {
      form.reset(EMPTY);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEdit, initial]);

  const createMut = trpc.user.create.useMutation();
  const updateMut = trpc.user.update.useMutation();
  const saving = createMut.isPending || updateMut.isPending;

  async function onSubmit(values: Values) {
    // Password is required on create, optional on edit.
    if (!isEdit && values.password.length < 6) {
      form.setError("password", {
        message: "Password must be at least 6 characters",
      });
      return;
    }
    if (isEdit && values.password && values.password.length < 6) {
      form.setError("password", {
        message: "Password must be at least 6 characters",
      });
      return;
    }

    const mobileNo = (values.mobile ?? "")
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean);
    const dob = values.dob ? new Date(values.dob) : null;

    try {
      if (isEdit) {
        await updateMut.mutateAsync({
          id: editId!,
          name: values.name,
          email: values.email,
          password: values.password || undefined,
          dob,
          mobileNo,
          role: values.role,
        });
        toast.success("User updated");
      } else {
        await createMut.mutateAsync({
          name: values.name,
          email: values.email,
          password: values.password,
          dob,
          mobileNo,
          role: values.role,
        });
        toast.success("User created");
      }
      await utils.user.list.invalidate();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit user" : "New user"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this team member's details, role and access."
              : "Add a team member and assign their role."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-4 sm:grid-cols-2"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Full name" autoFocus {...field} />
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
                    <Input
                      type="email"
                      autoComplete="off"
                      placeholder="user@company.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>
                    {isEdit ? "New password" : "Password"}
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder={
                          isEdit ? "Leave blank to keep current" : "••••••••"
                        }
                        className="pr-10"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted-foreground transition-colors hover:text-foreground"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormDescription>
                    {isEdit
                      ? "Leave blank to keep the current password."
                      : "At least 6 characters."}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {ROLE_LABELS[r]}
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
              name="dob"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date of birth</FormLabel>
                  <DatePicker
                    value={field.value ? parseISO(field.value) : null}
                    onChange={(d) =>
                      field.onChange(d ? format(d, "yyyy-MM-dd") : "")
                    }
                    placeholder="Select date of birth"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mobile"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Mobile</FormLabel>
                  <FormControl>
                    <Input placeholder="Comma separated" {...field} />
                  </FormControl>
                  <FormDescription>
                    Separate multiple numbers with commas.
                  </FormDescription>
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
                {isEdit ? "Save changes" : "Create user"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
