"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
import { WdsPasswordInput } from "../ui/password-input";
import { BetterAuthActionButton } from "./better-auth-action-button";

// biome-ignore lint/style/noNonNullAssertion: <>
const callbackUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_CALLBACK_URL!;

const signInSchema = z.object({
  email: z.email({ error: "Email is required" }).min(1, "Email is required"),
  password: z.string().min(1, "Password is required."),
});

type SignInFormType = z.infer<typeof signInSchema>;

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [timeToNextResend, setTimeToNextResend] = useState(60);
  const interval = useRef<NodeJS.Timeout>(undefined);
  const router = useRouter();

  const form = useForm<SignInFormType>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const { isSubmitting } = form.formState;

  async function onSubmit(data: SignInFormType) {
    await authClient.signIn.email(
      {
        email: data.email,
        password: data.password,
        callbackURL: callbackUrl,
      },
      {
        onError: (err) => {
          console.log(err);
          toast.error(err.error.message || "Failed to Sign In");
          if (err.error.message === "Email not verified") {
            setEmail(data.email);
            authClient.sendVerificationEmail({
              email: data.email,
              callbackURL: callbackUrl,
            });
          }
          form.reset();
        },
        onSuccess: async (ctx) => {
          form.reset();
          if (ctx.data.twoFactorRedirect) {
            const { data } = await authClient.twoFactor.sendOtp();
            if (data) {
              router.push("/auth/verify-2fa");
            } else {
              toast.error("Failed to Sign In. Try Again!");
            }
          }
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

  if (email) {
    return (
      <Card>
        <CardHeader className="text-2xl font-bold">
          <CardTitle>Verify Your Email</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mt-2">
              We sent you a verification link. Please check your email and click
              the link to verify your account.
            </p>

            <BetterAuthActionButton
              variant="outline"
              className="w-full hover:cursor-pointer"
              successMessage="Verification email sent!"
              disabled={timeToNextResend > 0}
              action={() => {
                startEmailVerificationCountdown();
                return authClient.sendVerificationEmail({
                  email,
                  callbackURL: callbackUrl,
                });
              }}
            >
              {timeToNextResend > 0
                ? `Resend Email (${timeToNextResend})`
                : "Resend Email"}
            </BetterAuthActionButton>
          </div>
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          Can't find the email? Check spam folder
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <form
          id="sign-in-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <FieldGroup>
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="sign-in-email">Email</FieldLabel>
                  <Input
                    {...field}
                    id="sign-in-email"
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

            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <div className="flex justify-between items-center">
                    <FieldLabel htmlFor="sign-in-password">Password</FieldLabel>
                    <Link
                      href="/auth/forgot-password"
                      className="text-sm hover:underline text-muted-foreground"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                  <WdsPasswordInput
                    {...field}
                    placeholder="Password"
                    id="sign-in-password"
                    aria-invalid={fieldState.invalid}
                  />
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
          form="sign-in-form"
          className="w-full hover:cursor-pointer"
          disabled={isSubmitting}
        >
          <LoadingSwap isLoading={isSubmitting}>Sign In</LoadingSwap>
        </Button>
        <p className="text-sm text-muted-foreground text-center">
          Don't have an account?{" "}
          <Link href="/auth/register" className="text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
