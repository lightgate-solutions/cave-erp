"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { BetterAuthActionButton } from "./better-auth-action-button";

// biome-ignore lint/style/noNonNullAssertion: <>
const callbackUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_CALLBACK_URL!;

type VerifyEmailFormProps = {
  email: string;
};

export function VerifyEmailForm({ email }: VerifyEmailFormProps) {
  const [timeToNextResend, setTimeToNextResend] = useState(60);
  const interval = useRef<NodeJS.Timeout>(undefined);

  // biome-ignore lint/correctness/useExhaustiveDependencies: mount-only countdown bootstrap
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
    <Card className="border-border">
      <CardHeader>
        <CardTitle>Verify your email</CardTitle>
        <CardDescription>
          We sent a link to <span className="font-medium">{email}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Open the email and click the link to verify your account. After
            that, you can use the dashboard as usual.
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
              ? `Resend email (${timeToNextResend}s)`
              : "Resend verification email"}
          </BetterAuthActionButton>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-3 text-sm text-muted-foreground">
        <p>Can&apos;t find the email? Check your spam folder.</p>
        <p className="text-center">
          <Link href="/auth/login" className="text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
