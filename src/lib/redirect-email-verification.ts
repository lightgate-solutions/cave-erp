import { redirect } from "next/navigation";

export function redirectIfUnverifiedEmail(user: {
  email: string;
  emailVerified?: boolean | null;
}) {
  if (!user.emailVerified) {
    redirect(`/auth/verify-email?email=${encodeURIComponent(user.email)}`);
  }
}
