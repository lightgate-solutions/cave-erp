import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Zap, Code, BookOpen, Settings, ArrowRight } from "lucide-react";
import { DocumentationSearch } from "@/components/marketing/documentation-search";

export default function DocumentationPage() {
  return (
    <div className="container mx-auto px-4 py-12 md:px-6 md:py-16">
      {/* Hero Section */}
      <section className="border-b border-border pb-16 mb-16">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">
            CAVE ERP Documentation
          </h1>
          <p className="mb-8 text-lg text-foreground/80 leading-relaxed">
            Everything you need to know, explained simply
          </p>

          {/* Search Bar */}
          <DocumentationSearch
            modules={[
              {
                title: "Financial Management",
                desc: "Manage company balance, expenses, payruns, and loans",
              },
              {
                title: "Human Resources & Payroll",
                desc: "Employee management, payroll, and attendance",
              },
              {
                title: "Project Management & Tracking",
                desc: "Task tracking, milestones, and team collaboration",
              },
              {
                title: "Task & Performance Management",
                desc: "Task assignment, performance tracking, and reviews",
              },
              {
                title: "Document Management System",
                desc: "Organize, store, and manage documents with role-based access control and secure sharing features",
              },
              {
                title: "Digital E-Signature & Document Authentication",
                desc: "Sign documents, proposals, and memos electronically with secure document authentication",
              },
              {
                title: "Email System",
                desc: "Internal email communication, inbox management, and messaging",
              },
              {
                title: "Procurement & Vendor Management",
                desc: "Purchase orders, vendor management, and approvals (Premium feature)",
              },
              {
                title: "Asset & Maintenance Management",
                desc: "Track and manage company assets and resources (Premium feature)",
              },
              {
                title: "Business Intelligence & Reporting",
                desc: "Advanced analytics, custom reports, and business intelligence dashboards",
              },
              {
                title: "Manufacturing & Production Planning",
                desc: "Production planning, manufacturing workflows, and resource allocation",
              },
              {
                title: "Compliance & Audit Management",
                desc: "Audit trails, compliance tracking, and regulatory reporting",
              },
              {
                title: "News Management",
                desc: "Create and publish news articles with organization-wide notifications",
              },
            ]}
            tutorials={[]}
            quickStartItems={[]}
          />
        </div>
      </section>

      {/* Quick Start */}
      <section className="mb-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-8 text-3xl font-bold text-foreground">
            Quick Start
          </h2>

          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                icon: Zap,
                title: "Getting Started",
                description: "Learn the basics and set up your first project",
                href: "/documentation/getting-started",
              },
              {
                icon: Settings,
                title: "Modules",
                description: "Explore all available modules and features",
                href: "/documentation/modules",
              },
              {
                icon: BookOpen,
                title: "Tutorials",
                description: "Step-by-step guides with screenshots",
                href: "/documentation/tutorials",
              },
              {
                icon: Code,
                title: "API Reference",
                description:
                  "Complete API documentation and integration guides",
                href: "/documentation/api",
              },
            ].map((item) => (
              <Link key={item.href} href={item.href}>
                <Card className="flex h-full flex-col p-6 transition-colors hover:border-primary hover:shadow-md">
                  <item.icon className="mb-4 h-10 w-10 text-primary" />
                  <h3 className="mb-3 text-xl font-semibold leading-tight text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-auto text-sm leading-relaxed text-foreground/70">
                    {item.description}
                  </p>
                  <Button
                    variant="ghost"
                    className="mt-4 w-fit p-0 h-auto font-medium text-primary hover:text-primary/80"
                    asChild
                  >
                    <Link href={item.href}>
                      Learn more <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
