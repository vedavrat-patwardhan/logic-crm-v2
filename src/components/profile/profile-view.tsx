"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Role } from "@prisma/client";
import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { trpc } from "@/trpc/react";
import { initials } from "@/lib/format";
import { ROLE_LABELS } from "@/lib/constants";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const schema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });
type Values = z.infer<typeof schema>;

export function ProfileView({
  name,
  email,
  role,
}: {
  name: string;
  email: string;
  role: Role;
}) {
  const [show, setShow] = React.useState({
    current: false,
    next: false,
    confirm: false,
  });

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const changeMut = trpc.user.changePassword.useMutation();

  async function onSubmit(values: Values) {
    try {
      await changeMut.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      toast.success("Password updated");
      form.reset();
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Could not update password";
      toast.error(message);
      if (/current password/i.test(message)) {
        form.setError("currentPassword", { message });
      }
    }
  }

  const saving = changeMut.isPending;

  function toggle(key: keyof typeof show) {
    setShow((s) => ({ ...s, [key]: !s[key] }));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Your account details and security settings."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Your profile information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar size="lg">
                <AvatarFallback>{initials(name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 space-y-1">
                <p className="truncate text-base font-semibold">
                  {name || "—"}
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  {email || "—"}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <span className="text-sm text-muted-foreground">Role</span>
              <Badge variant="secondary">{ROLE_LABELS[role]}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change password</CardTitle>
            <CardDescription>
              Use a strong password you don&apos;t reuse elsewhere.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={show.current ? "text" : "password"}
                            autoComplete="current-password"
                            placeholder="••••••••"
                            className="pr-10"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => toggle("current")}
                            className="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted-foreground transition-colors hover:text-foreground"
                            aria-label={
                              show.current ? "Hide password" : "Show password"
                            }
                            tabIndex={-1}
                          >
                            {show.current ? (
                              <EyeOff className="size-4" />
                            ) : (
                              <Eye className="size-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={show.next ? "text" : "password"}
                            autoComplete="new-password"
                            placeholder="At least 6 characters"
                            className="pr-10"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => toggle("next")}
                            className="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted-foreground transition-colors hover:text-foreground"
                            aria-label={
                              show.next ? "Hide password" : "Show password"
                            }
                            tabIndex={-1}
                          >
                            {show.next ? (
                              <EyeOff className="size-4" />
                            ) : (
                              <Eye className="size-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm new password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={show.confirm ? "text" : "password"}
                            autoComplete="new-password"
                            placeholder="Re-enter new password"
                            className="pr-10"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => toggle("confirm")}
                            className="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted-foreground transition-colors hover:text-foreground"
                            aria-label={
                              show.confirm ? "Hide password" : "Show password"
                            }
                            tabIndex={-1}
                          >
                            {show.confirm ? (
                              <EyeOff className="size-4" />
                            ) : (
                              <Eye className="size-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={saving} className="w-full">
                  {saving ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <KeyRound className="size-4" />
                  )}
                  {saving ? "Updating…" : "Update password"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
