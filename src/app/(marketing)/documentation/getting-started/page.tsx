import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Zap } from "lucide-react";

export default function GettingStartedPage() {
  return (
    <div className="container mx-auto px-4 py-12 md:px-6 md:py-16">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">
              Getting Started
            </h1>
          </div>
          <p className="text-lg text-foreground/80 leading-relaxed">
            Learn the basics and set up your CAVE ERP workspace in minutes
          </p>
        </div>

        <div className="space-y-8">
          {/* Installation & Setup */}
          <Card className="p-6">
            <h2 className="mb-4 text-2xl font-semibold text-foreground">
              Installation & Setup
            </h2>
            <p className="mb-4 text-foreground/80 leading-relaxed">
              Install CAVE ERP from web, desktop, or Microsoft Store. Get
              started quickly with our simple setup process.
            </p>
            <div className="space-y-4">
              <div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  Web Installation
                </h3>
                <p className="text-sm text-foreground/70">
                  Access CAVE ERP directly from your web browser. No
                  installation required - just sign up and start using it
                  immediately.
                </p>
              </div>
              <div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  Desktop Application
                </h3>
                <p className="text-sm text-foreground/70">
                  Download the desktop application for Windows, macOS, or Linux.
                  Get native performance and offline capabilities.
                </p>
              </div>
              <div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  Microsoft Store
                </h3>
                <p className="text-sm text-foreground/70">
                  Install CAVE ERP from the Microsoft Store for automatic
                  updates and seamless Windows integration.
                </p>
              </div>
            </div>
          </Card>

          {/* First Steps */}
          <Card className="p-6">
            <h2 className="mb-4 text-2xl font-semibold text-foreground">
              First Steps: Creating Your Organization
            </h2>
            <p className="mb-4 text-foreground/80 leading-relaxed">
              Create your organization and set up your workspace to get started
              with CAVE ERP.
            </p>
            <div className="space-y-3">
              <div className="flex gap-3">
                <span className="mt-0.5 shrink-0 font-semibold text-primary">
                  1.
                </span>
                <p className="flex-1 text-sm text-foreground/80">
                  Go to Settings from your profile menu
                </p>
              </div>
              <div className="flex gap-3">
                <span className="mt-0.5 shrink-0 font-semibold text-primary">
                  2.
                </span>
                <p className="flex-1 text-sm text-foreground/80">
                  Click the 'Create Organization' button
                </p>
              </div>
              <div className="flex gap-3">
                <span className="mt-0.5 shrink-0 font-semibold text-primary">
                  3.
                </span>
                <p className="flex-1 text-sm text-foreground/80">
                  Enter your organization name in the modal
                </p>
              </div>
              <div className="flex gap-3">
                <span className="mt-0.5 shrink-0 font-semibold text-primary">
                  4.
                </span>
                <p className="flex-1 text-sm text-foreground/80">
                  Configure billing preferences
                </p>
              </div>
              <div className="flex gap-3">
                <span className="mt-0.5 shrink-0 font-semibold text-primary">
                  5.
                </span>
                <p className="flex-1 text-sm text-foreground/80">
                  Start inviting team members
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm text-foreground/70 italic">
              Complete setup in under 2 minutes.
            </p>
          </Card>

          {/* User Management */}
          <Card className="p-6">
            <h2 className="mb-4 text-2xl font-semibold text-foreground">
              User Management
            </h2>
            <p className="mb-4 text-foreground/80 leading-relaxed">
              Add users, assign roles, and set permissions to control access
              across your organization.
            </p>
            <div className="space-y-3">
              <div className="flex gap-3">
                <span className="mt-0.5 shrink-0 font-semibold text-primary">
                  1.
                </span>
                <p className="flex-1 text-sm text-foreground/80">
                  Navigate to User Management from the admin menu
                </p>
              </div>
              <div className="flex gap-3">
                <span className="mt-0.5 shrink-0 font-semibold text-primary">
                  2.
                </span>
                <p className="flex-1 text-sm text-foreground/80">
                  Click 'Invite User' and enter their email
                </p>
              </div>
              <div className="flex gap-3">
                <span className="mt-0.5 shrink-0 font-semibold text-primary">
                  3.
                </span>
                <p className="flex-1 text-sm text-foreground/80">
                  Select a role or create a custom role
                </p>
              </div>
              <div className="flex gap-3">
                <span className="mt-0.5 shrink-0 font-semibold text-primary">
                  4.
                </span>
                <p className="flex-1 text-sm text-foreground/80">
                  Set module-specific permissions
                </p>
              </div>
              <div className="flex gap-3">
                <span className="mt-0.5 shrink-0 font-semibold text-primary">
                  5.
                </span>
                <p className="flex-1 text-sm text-foreground/80">
                  Activate the user account
                </p>
              </div>
            </div>
          </Card>

          {/* Dashboard Overview */}
          <Card className="p-6">
            <h2 className="mb-4 text-2xl font-semibold text-foreground">
              Dashboard Overview
            </h2>
            <p className="mb-4 text-foreground/80 leading-relaxed">
              Navigate the main dashboard and access key features efficiently.
            </p>
            <div className="space-y-3">
              <div className="flex gap-3">
                <span className="mt-0.5 shrink-0 font-semibold text-primary">
                  1.
                </span>
                <p className="flex-1 text-sm text-foreground/80">
                  Use the left sidebar to navigate between modules
                </p>
              </div>
              <div className="flex gap-3">
                <span className="mt-0.5 shrink-0 font-semibold text-primary">
                  2.
                </span>
                <p className="flex-1 text-sm text-foreground/80">
                  View key metrics and recent activity on the dashboard
                </p>
              </div>
              <div className="flex gap-3">
                <span className="mt-0.5 shrink-0 font-semibold text-primary">
                  3.
                </span>
                <p className="flex-1 text-sm text-foreground/80">
                  Check notifications in the top bar
                </p>
              </div>
              <div className="flex gap-3">
                <span className="mt-0.5 shrink-0 font-semibold text-primary">
                  4.
                </span>
                <p className="flex-1 text-sm text-foreground/80">
                  Customize dashboard widgets via settings
                </p>
              </div>
              <div className="flex gap-3">
                <span className="mt-0.5 shrink-0 font-semibold text-primary">
                  5.
                </span>
                <p className="flex-1 text-sm text-foreground/80">
                  Switch between different views based on your role
                </p>
              </div>
            </div>
          </Card>

          {/* Next Steps */}
          <Card className="p-6 bg-primary/5 border-primary/20">
            <h2 className="mb-4 text-2xl font-semibold text-foreground">
              Next Steps
            </h2>
            <p className="mb-4 text-foreground/80 leading-relaxed">
              Now that you're set up, explore our modules and tutorials to get
              the most out of CAVE ERP.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/documentation/modules"
                className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80"
              >
                Explore Modules →
              </Link>
              <Link
                href="/documentation/tutorials"
                className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80"
              >
                View Tutorials →
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
