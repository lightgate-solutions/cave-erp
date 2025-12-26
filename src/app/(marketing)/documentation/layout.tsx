"use client";

import { DocumentationSidebar } from "@/components/marketing/documentation-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Logo } from "@/components/marketing/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { AnchorLink } from "@/components/marketing/anchor-link";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DocumentationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/95 shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Logo />

          <nav className="hidden items-center space-x-6 md:flex">
            <AnchorLink
              href="/#features"
              className="text-sm font-medium text-foreground transition-all duration-300 px-3 py-1.5 rounded-md relative bg-transparent hover:shadow-md hover:text-primary"
            >
              Features
            </AnchorLink>
            <AnchorLink
              href="/#pricing"
              className="text-sm font-medium text-foreground transition-all duration-300 px-3 py-1.5 rounded-md relative bg-transparent hover:shadow-md hover:text-primary"
            >
              Pricing
            </AnchorLink>
            <Link
              href="/documentation"
              className="text-sm font-medium text-primary font-semibold transition-all duration-300 px-3 py-1.5 rounded-md relative bg-transparent hover:shadow-md"
            >
              Documentation
            </Link>
            <Link
              href="/help"
              className="text-sm font-medium text-foreground transition-all duration-300 px-3 py-1.5 rounded-md relative bg-transparent hover:shadow-md hover:text-primary"
            >
              Help
            </Link>
          </nav>

          <div className="flex items-center space-x-3">
            <ThemeToggle />
            <Button
              variant="outline"
              size="sm"
              asChild
              className="hidden md:flex rounded-full font-medium px-6 h-10 bg-card border-border text-card-foreground hover:bg-accent hover:text-accent-foreground shadow-sm"
            >
              <Link href="/auth/login" prefetch={true}>
                Sign In
              </Link>
            </Button>
            <Button
              size="sm"
              asChild
              className="rounded-full font-semibold px-6 h-10 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg transition-all"
            >
              <Link href="/auth/register" prefetch={true}>
                Try It Free
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Sidebar Layout */}
      <SidebarProvider>
        <DocumentationSidebar />
        <SidebarInset>
          <main className="flex-1 bg-background">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
