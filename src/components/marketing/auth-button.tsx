"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useEffect, useState } from "react";

interface AuthButtonProps {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  children: React.ReactNode;
  href: string;
}

export function AuthButton({
  variant,
  size,
  className,
  children,
  href,
}: AuthButtonProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check authentication status
    authClient
      .getSession()
      .then((result) => {
        setIsAuthenticated(!!result?.data?.user);
      })
      .catch(() => {
        setIsAuthenticated(false);
      })
      .finally(() => {
        setIsChecking(false);
      });
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // If clicking Sign In and already authenticated, go to dashboard
    // The auth layout will also handle this, but this provides immediate redirect
    if (href === "/auth/login" && isAuthenticated && !isChecking) {
      e.preventDefault();
      router.push("/dashboard");
    }
  };

  // If still checking, just render the button normally
  if (isChecking) {
    return (
      <Button variant={variant} size={size} asChild className={className}>
        <Link href={href} prefetch={true}>
          {children}
        </Link>
      </Button>
    );
  }

  return (
    <Button variant={variant} size={size} asChild className={className}>
      <Link href={href} onClick={handleClick} prefetch={true}>
        {children}
      </Link>
    </Button>
  );
}
