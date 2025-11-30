"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { authClient } from "@/lib/auth-client";
import { LoadingSwap } from "../ui/loading-swap";
import { WdsPasswordInput } from "../ui/password-input";

const passwordSchema = z.object({
  password: z.string().min(1),
});

type PasswordForm = z.infer<typeof passwordSchema>;

export default function TwoFactorAuth({ isEnabled }: { isEnabled: boolean }) {
  const router = useRouter();

  const form = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: "",
    },
  });
  const { isSubmitting } = form.formState;

  async function handleDisableTwoFactorAuth(data: PasswordForm) {
    await authClient.twoFactor.disable(
      {
        password: data.password,
      },
      {
        onError: (error) => {
          toast.error(error.error.message || "Failed to disable 2FA");
        },
        onSuccess: () => {
          form.reset();
          toast.success("2FA verification disabled");
          setTimeout(() => {
            router.refresh();
          }, 1000);
        },
      },
    );
  }

  async function handleEnableTwoFactorAuth(data: PasswordForm) {
    await authClient.twoFactor.enable(
      {
        password: data.password,
      },
      {
        onError: (error) => {
          toast.error(error.error.message || "Failed to enable 2FA");
        },
        onSuccess: () => {
          form.reset();
          toast.success("2FA verification enabled");
          setTimeout(() => {
            router.refresh();
          }, 1000);
        },
      },
    );
  }

  return (
    <form
      id="update-password-form"
      onSubmit={form.handleSubmit(
        isEnabled ? handleDisableTwoFactorAuth : handleEnableTwoFactorAuth,
      )}
      className="space-y-4"
    >
      <FieldGroup>
        <Controller
          name="password"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="tfa-password">Password</FieldLabel>
              <WdsPasswordInput
                {...field}
                placeholder="Password"
                id="tfa-password"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full"
        variant={isEnabled ? "destructive" : "default"}
      >
        <LoadingSwap isLoading={isSubmitting}>
          {isEnabled ? "Disable 2FA" : "Enable 2FA"}
        </LoadingSwap>
      </Button>
    </form>
  );
}
