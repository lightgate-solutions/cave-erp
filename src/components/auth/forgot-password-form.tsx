"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { LoadingSwap } from "../ui/loading-swap";

const forgotPasswordSchema = z.object({
  email: z.email({ error: "Email is required" }).min(1, "Email is required"),
});

type ForgotPasswordFormType = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const form = useForm<ForgotPasswordFormType>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });
  const { isSubmitting } = form.formState;

  async function onSubmit(data: ForgotPasswordFormType) {
    await authClient.requestPasswordReset(
      {
        email: data.email,
        redirectTo: "/auth/reset-password",
      },
      {
        onError: (err) => {
          toast.error(
            err.error.message || "Failed to send password reset email",
          );
          form.reset();
        },
        onSuccess: () => {
          form.reset();
          toast.success("Password reset email sent");
        },
      },
    );
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle>Forgot Password ?</CardTitle>
        <CardDescription>
          Enter your email to request password reset link
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <form
          id="forgot-password-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <FieldGroup>
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="forgot-password-email">Email</FieldLabel>
                  <Input
                    {...field}
                    id="forgot-password-email"
                    aria-invalid={fieldState.invalid}
                    placeholder="abc@ventures.com.ng"
                    autoComplete="email"
                    type="email"
                  />
                  <FieldDescription>
                    This is your active email address
                  </FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col space-y-4">
        <Button
          type="submit"
          form="forgot-password-form"
          className="w-full hover:cursor-pointer"
          disabled={isSubmitting}
        >
          <LoadingSwap isLoading={isSubmitting}>Send Reset Email</LoadingSwap>
        </Button>
        <p className="text-sm text-muted-foreground text-center">
          Remember your password?{" "}
          <Link href="/auth/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
