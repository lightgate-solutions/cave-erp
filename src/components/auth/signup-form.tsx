"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
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
import PasswordInput from "./password-input";
import { BetterAuthActionButton } from "./better-auth-action-button";
import {
  SUPPORTED_OAUTH_PROVIDER_DETAILS,
  SUPPORTED_OAUTH_PROVIDERS,
} from "@/lib/o-auth-providers";

// biome-ignore lint/style/noNonNullAssertion: <>
const callbackUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_CALLBACK_URL!;

const signUpSchema = z
  .object({
    email: z.email({ error: "Email is required" }).min(1, "Email is required"),
    name: z.string({ error: "Name is required" }).min(1, "Name is required"),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z
      .string()
      .min(8, "Password must be at least 8 characters."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords does not match",
  });

type SignUpFormType = z.infer<typeof signUpSchema>;

export function SignupForm() {
  const [email, setEmail] = useState("");
  const [timeToNextResend, setTimeToNextResend] = useState(60);
  const interval = useRef<NodeJS.Timeout>(undefined);

  const form = useForm<SignUpFormType>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });
  const { isSubmitting } = form.formState;

  async function onSubmit(data: SignUpFormType) {
    const res = await authClient.signUp.email(
      {
        email: data.email,
        password: data.password,
        name: data.name,
        callbackURL: callbackUrl,
      },
      {
        onError: (err) => {
          toast.error(err.error.message || "Failed to Sign Up");
          form.reset();
        },
        onSuccess: () => {
          toast.success("Verify Email and Login to Continue");
        },
      },
    );

    if (res.error == null && !res.data.user.emailVerified) {
      setEmail(data.email);
    }
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
        <CardTitle>Create account</CardTitle>
        <CardDescription>Get started with CAVE in minutes</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          id="sign-up-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="sign-up-name">Full Name</FieldLabel>
                  <Input
                    {...field}
                    id="sign-up-name"
                    aria-invalid={fieldState.invalid}
                    placeholder="John Mary"
                    type="text"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="sign-up-email">Email</FieldLabel>
                  <Input
                    {...field}
                    id="sign-up-email"
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
                  <FieldLabel htmlFor="sign-up-password">Password</FieldLabel>
                  <PasswordInput
                    {...field}
                    id="sign-up-password"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="confirmPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="sign-up-confirm-password">
                    Confirm Password
                  </FieldLabel>
                  <WdsPasswordInput
                    {...field}
                    placeholder="Confirm Password"
                    id="sign-up-confirm-password"
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
        <SocialAuthButtons />
        <Button
          type="submit"
          form="sign-up-form"
          className="w-full hover:cursor-pointer"
          disabled={isSubmitting}
        >
          <LoadingSwap isLoading={isSubmitting}>Create Account</LoadingSwap>
        </Button>
        <p className="text-sm text-muted-foreground text-center">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

export function SocialAuthButtons() {
  return SUPPORTED_OAUTH_PROVIDERS.map((provider) => {
    return (
      <BetterAuthActionButton
        variant="outline"
        className="w-full"
        key={provider}
        action={() => {
          return authClient.signIn.social({
            provider,
            callbackURL: callbackUrl,
          });
        }}
      >
        {SUPPORTED_OAUTH_PROVIDER_DETAILS[provider].name}
      </BetterAuthActionButton>
    );
  });
}
