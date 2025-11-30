"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { BetterAuthActionButton } from "@/components/auth/better-auth-action-button";
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
  FieldLabel,
} from "@/components/ui/field";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { authClient } from "@/lib/auth-client";

const FormSchema = z.object({
  pin: z.string().min(6, {
    message: "Your one-time password must be 6 characters.",
  }),
});

export default function OtpPage() {
  const [timeToNextResend, setTimeToNextResend] = useState(60);
  const interval = useRef<NodeJS.Timeout>(undefined);
  const router = useRouter();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      pin: "",
    },
  });
  const { isSubmitting } = form.formState;

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    await authClient.twoFactor.verifyOtp(
      {
        code: data.pin,
        trustDevice: true,
      },
      {
        onError: (err) => {
          form.reset();
          toast.error(err.error.message || "Failed to verify OTP");
        },
        onSuccess: () => {
          form.reset();
          toast.success("OTP Login Successfull!", {
            description: "Redirecting to login...",
          });
          setTimeout(() => {
            router.push("/");
          }, 1000);
        },
      },
    );
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    startEmailVerificationCountdown();
  }, []);

  function startEmailVerificationCountdown(time = 60) {
    setTimeToNextResend(time);

    clearInterval(interval.current);
    interval.current = setInterval(() => {
      setTimeToNextResend((t) => {
        const newT = t - 1;

        if (newT <= 0) {
          clearInterval(interval.current);
          return 0;
        }
        return newT;
      });
    }, 1000);
  }

  return (
    <div className="w-full mx-auto pt-10 max-w-md space-y-8">
      <Card className="border-border">
        <CardHeader>
          <CardTitle>2FA Verification</CardTitle>
          <CardDescription>Check email for OTP Pin</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <form
            className="space-y-4"
            id="verify-otp-form"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <Controller
              name="pin"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="otp">One-Time Pin</FieldLabel>
                  <FieldDescription>
                    Please enter the one-time password sent to your email.
                  </FieldDescription>
                  <InputOTP maxLength={6} {...field}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Button
              type="submit"
              form="verify-otp-form"
              className="w-full hover:cursor-pointer"
              disabled={isSubmitting}
            >
              <LoadingSwap isLoading={isSubmitting}>Login OTP</LoadingSwap>
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <BetterAuthActionButton
            variant="outline"
            className="w-full hover:cursor-pointer"
            successMessage="OTP sent to email!"
            disabled={timeToNextResend > 0}
            action={() => {
              startEmailVerificationCountdown();
              return authClient.twoFactor.sendOtp();
            }}
          >
            {timeToNextResend > 0
              ? `Resend OTP (${timeToNextResend})`
              : "Resend OTP"}
          </BetterAuthActionButton>
        </CardFooter>
      </Card>
    </div>
  );
}
