import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { VerifyEmailForm } from "@/components/auth/verify-email-form";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { auth } from "@/lib/auth";

type PageProps = {
  searchParams: Promise<{ email?: string }>;
};

export default async function VerifyEmailPage({ searchParams }: PageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const { email: emailParam } = await searchParams;
  const email = (emailParam ?? session?.user.email ?? "").trim();

  if (!email) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center space-y-2">
          <Logo size="lg" />
          <h1 className="text-2xl font-bold text-foreground">
            Check your inbox
          </h1>
          <p className="text-muted-foreground text-center text-sm">
            One more step before you can open the app
          </p>
        </div>
        <VerifyEmailForm email={email} />
        <p className="text-center text-xs text-muted-foreground">
          Wrong account?{" "}
          <Link
            href="/auth/login"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Sign in with a different email
          </Link>
        </p>
      </div>
    </div>
  );
}
