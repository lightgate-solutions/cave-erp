import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  BookOpen,
  Code,
  Zap,
  Settings,
  FileText,
  HelpCircle,
} from "lucide-react";
import { DocumentationSearch } from "@/components/marketing/documentation-search";
import { AnchorLink } from "@/components/marketing/anchor-link";

export default function DocumentationPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#faf9f7]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[#e8e8e8] bg-white/98 backdrop-blur supports-[backdrop-filter]:bg-white/95 shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary shadow-md">
              <span className="text-xl font-extrabold text-primary-foreground">
                C
              </span>
            </div>
            <span className="text-2xl font-extrabold tracking-tight">
              CAVE ERP
            </span>
          </Link>

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
            <Button
              variant="outline"
              size="sm"
              asChild
              className="hidden md:flex rounded-full font-medium px-6 h-10 bg-white border-[#e0e0e0] text-foreground hover:bg-[#faf9f7] hover:border-[#d0d0d0] shadow-sm"
            >
              <Link href="/auth/login" prefetch={true}>
                Sign In
              </Link>
            </Button>
            <Button
              size="sm"
              asChild
              className="rounded-full font-semibold px-6 h-10 bg-foreground text-background hover:bg-foreground/90 shadow-md hover:shadow-lg transition-all"
            >
              <Link href="/auth/register" prefetch={true}>
                Try It Free
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 bg-white">
        {/* Hero Section */}
        <section className="border-b border-[#e8e8e8] bg-[#faf9f7] py-16">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="mb-4 text-4xl font-bold md:text-5xl">
                Documentation
              </h1>
              <p className="mb-8 text-lg text-muted-foreground">
                Everything you need to know about CAVE ERP
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
                tutorials={[
                  {
                    id: "first-steps",
                    title: "First Steps: Creating Your Organization",
                    steps:
                      "Create your organization and set up your organization name to get started with CAVE ERP",
                  },
                  {
                    id: "user-management",
                    title: "User Management",
                    steps: "Add users, set permissions, and manage roles",
                  },
                  {
                    id: "dashboard-overview",
                    title: "Dashboard Overview",
                    steps: "Navigate the main dashboard and key features",
                  },
                  {
                    id: "financial-management",
                    title: "Financial Management",
                    steps:
                      "Manage company balance, expenses, payruns, and loans",
                  },
                  {
                    id: "document-management",
                    title: "Document Management System",
                    steps:
                      "Organize, store, and manage documents with role-based access control and secure sharing features",
                  },
                  {
                    id: "email-system",
                    title: "Email System",
                    steps:
                      "Internal email communication, inbox management, and messaging",
                  },
                  {
                    id: "project-management",
                    title: "Project Management & Tracking",
                    steps: "Task tracking, milestones, and team collaboration",
                  },
                  {
                    id: "task-performance-management",
                    title: "Task & Performance Management",
                    steps: "Task assignment, performance tracking, and reviews",
                  },
                  {
                    id: "hr-payroll",
                    title: "Human Resources & Payroll",
                    steps: "Employee management, payroll, and attendance",
                  },
                  {
                    id: "news-management",
                    title: "News Management",
                    steps:
                      "Create and publish news articles with organization-wide notifications",
                  },
                  {
                    id: "data-export",
                    title: "Data Export",
                    steps:
                      "Download and export application data in CSV format for reporting and analysis",
                  },
                ]}
                quickStartItems={[
                  {
                    title: "Getting Started",
                    description:
                      "Learn the basics and set up your first project in minutes",
                    href: "#getting-started",
                  },
                  {
                    title: "API Reference",
                    description:
                      "Complete API documentation and integration guides",
                    href: "#api-reference",
                  },
                  {
                    title: "Tutorials",
                    description: "Step-by-step guides for common use cases",
                    href: "#tutorials",
                  },
                ]}
              />
            </div>
          </div>
        </section>

        {/* Quick Start */}
        <section className="container mx-auto px-4 py-12 md:px-6 md:py-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-8 text-3xl font-bold">Quick Start</h2>

            <div className="grid gap-5 md:grid-cols-3">
              {[
                {
                  icon: Zap,
                  title: "Getting Started",
                  description:
                    "Learn the basics and set up your first project in minutes",
                  href: "#getting-started",
                },
                {
                  icon: Code,
                  title: "API Reference",
                  description:
                    "Complete API documentation and integration guides",
                  href: "#api-reference",
                },
                {
                  icon: BookOpen,
                  title: "Tutorials",
                  description: "Step-by-step guides for common use cases",
                  href: "#tutorials",
                },
              ].map((item) => (
                <Link key={item.href} href={item.href}>
                  <Card className="flex h-full flex-col p-5 transition-colors hover:border-primary">
                    <item.icon className="mb-3 h-10 w-10 text-primary" />
                    <h3 className="mb-3 text-xl font-semibold leading-tight">
                      {item.title}
                    </h3>
                    <p className="mt-auto text-sm leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Main Documentation Categories */}
        <section className="border-t border-[#e8e8e8] bg-white py-12 md:py-16">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto max-w-5xl">
              <h2 className="mb-8 text-3xl font-bold">
                Documentation Categories
              </h2>

              <div className="space-y-8">
                {/* Getting Started */}
                <Card className="p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Zap className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-2xl font-semibold">Getting Started</h3>
                  </div>
                  <div className="grid gap-5 md:grid-cols-2">
                    <Link href="#" className="group">
                      <div className="flex h-full flex-col rounded-lg border p-5 transition-colors hover:border-primary">
                        <h4 className="mb-3 font-semibold leading-tight group-hover:text-primary">
                          Installation & Setup
                        </h4>
                        <p className="mt-auto text-sm leading-relaxed text-muted-foreground">
                          Install CAVE ERP from an online download or the
                          Microsoft Store
                        </p>
                      </div>
                    </Link>
                    <Link href="#first-steps" className="group">
                      <div className="flex h-full flex-col rounded-lg border p-5 transition-colors hover:border-primary">
                        <h4 className="mb-3 font-semibold leading-tight group-hover:text-primary">
                          First Steps
                        </h4>
                        <p className="mt-auto text-sm leading-relaxed text-muted-foreground">
                          Create your organization and set up your organization
                          name to get started with CAVE ERP
                        </p>
                      </div>
                    </Link>
                    <Link href="#user-management" className="group">
                      <div className="flex h-full flex-col rounded-lg border p-5 transition-colors hover:border-primary">
                        <h4 className="mb-3 font-semibold leading-tight group-hover:text-primary">
                          User Management
                        </h4>
                        <p className="mt-auto text-sm leading-relaxed text-muted-foreground">
                          Add users, set permissions, and manage roles
                        </p>
                      </div>
                    </Link>
                    <Link href="#dashboard-overview" className="group">
                      <div className="flex h-full flex-col rounded-lg border p-5 transition-colors hover:border-primary">
                        <h4 className="mb-3 font-semibold leading-tight group-hover:text-primary">
                          Dashboard Overview
                        </h4>
                        <p className="mt-auto text-sm leading-relaxed text-muted-foreground">
                          Navigate the main dashboard and key features
                        </p>
                      </div>
                    </Link>
                  </div>
                </Card>

                {/* Core Modules */}
                <Card className="p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Settings className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-2xl font-semibold">Core Modules</h3>
                  </div>
                  <div className="grid gap-5 md:grid-cols-2">
                    {[
                      // Core Business Functions
                      {
                        title: "Financial Management",
                        desc: "Manage company balance, expenses, payruns, and loans",
                        premium: false,
                      },
                      {
                        title: "Human Resources & Payroll",
                        desc: "Employee management, payroll, and attendance",
                        premium: false,
                      },
                      // Project & Task Management
                      {
                        title: "Project Management & Tracking",
                        desc: "Task tracking, milestones, and team collaboration",
                        premium: false,
                      },
                      {
                        title: "Task & Performance Management",
                        desc: "Task assignment, performance tracking, and reviews",
                        premium: false,
                      },
                      // Document Management
                      {
                        title: "Document Management System",
                        desc: "Organize, store, and manage documents with role-based access control and secure sharing features",
                        premium: false,
                      },
                      {
                        title: "Digital E-Signature & Document Authentication",
                        desc: "Sign documents, proposals, and memos electronically with secure document authentication",
                        premium: true,
                      },
                      // Communication
                      {
                        title: "Email System",
                        desc: "Internal email communication, inbox management, and messaging",
                        premium: false,
                      },
                      {
                        title: "News Management",
                        desc: "Create and publish news articles with organization-wide notifications",
                        premium: false,
                      },
                      // Operations & Procurement
                      {
                        title: "Procurement & Vendor Management",
                        desc: "Purchase orders, vendor management, and approvals",
                        premium: true,
                      },
                      {
                        title: "Asset & Maintenance Management",
                        desc: "Track and manage company assets and resources",
                        premium: true,
                      },
                      {
                        title: "Manufacturing & Production Planning",
                        desc: "Production planning, manufacturing workflows, and resource allocation",
                        premium: true,
                      },
                      // Analytics & Compliance
                      {
                        title: "Business Intelligence & Reporting",
                        desc: "Advanced analytics, custom reports, and business intelligence dashboards",
                        premium: true,
                      },
                      {
                        title: "Compliance & Audit Management",
                        desc: "Audit trails, compliance tracking, and regulatory reporting",
                        premium: true,
                      },
                    ].map((item) => {
                      // Map titles to anchor links for modules with tutorials
                      const hrefMap: Record<string, string> = {
                        "Financial Management": "#financial-management",
                        "Document Management System": "#document-management",
                        "Email System": "#email-system",
                        "Project Management & Tracking": "#project-management",
                        "Task & Performance Management":
                          "#task-performance-management",
                        "Human Resources & Payroll": "#hr-payroll",
                        "News Management": "#news-management",
                      };
                      const href = hrefMap[item.title] || "#";

                      return (
                        <Link key={item.title} href={href} className="group">
                          <div className="flex h-full flex-col rounded-lg border p-5 transition-colors hover:border-primary">
                            <div className="mb-3 flex items-start justify-between gap-2">
                              <h4 className="flex-1 font-semibold leading-tight group-hover:text-primary">
                                {item.title}
                              </h4>
                              {item.premium && (
                                <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                                  Premium
                                </span>
                              )}
                            </div>
                            <p className="mt-auto text-sm leading-relaxed text-muted-foreground">
                              {item.desc}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </Card>

                {/* Advanced Features */}
                <Card className="p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Code className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-2xl font-semibold">
                      Advanced Features
                    </h3>
                  </div>
                  <div className="grid gap-5 md:grid-cols-2">
                    {[
                      {
                        title: "API Integration",
                        desc: "Connect CAVE ERP with external systems",
                        premium: true,
                      },
                      {
                        title: "Custom Workflows",
                        desc: "Build automated workflows for your processes",
                        premium: true,
                      },
                    ].map((item) => (
                      <Link key={item.title} href="#" className="group">
                        <div className="flex h-full flex-col rounded-lg border p-5 transition-colors hover:border-primary">
                          <div className="mb-3 flex items-start justify-between gap-2">
                            <h4 className="flex-1 font-semibold leading-tight group-hover:text-primary">
                              {item.title}
                            </h4>
                            {item.premium && (
                              <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                                Premium
                              </span>
                            )}
                          </div>
                          <p className="mt-auto text-sm leading-relaxed text-muted-foreground">
                            {item.desc}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </Card>

                {/* Tutorials with Screenshots */}
                <Card className="p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <BookOpen className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-2xl font-semibold">
                      Step-by-Step Tutorials
                    </h3>
                  </div>
                  <div className="space-y-6">
                    {[
                      {
                        id: "first-steps",
                        title: "First Steps: Creating Your Organization",
                        steps:
                          "Create your organization and set up your organization name to get started with CAVE ERP",
                        images: [
                          {
                            src: "/landing/images/create-organization-button.png",
                            alt: "Create Organization button and billing section",
                          },
                          {
                            src: "/landing/images/create-organization-modal.png",
                            alt: "Create New Organization modal with organization name input",
                          },
                        ],
                      },
                      {
                        id: "user-management",
                        title: "User Management",
                        steps: "Add users, set permissions, and manage roles",
                        image: "/landing/images/user-management.png",
                      },
                      {
                        id: "dashboard-overview",
                        title: "Dashboard Overview",
                        steps: "Navigate the main dashboard and key features",
                        image: "/landing/images/dashboard-overview.png",
                      },
                      {
                        id: "financial-management",
                        title: "Financial Management",
                        steps:
                          "Manage company balance, expenses, payruns, and loans",
                        image: "/landing/images/finance-management.png",
                      },
                      {
                        id: "document-management",
                        title: "Document Management System",
                        steps:
                          "Organize, store, and manage documents with role-based access control and secure sharing features",
                        images: [
                          {
                            src: "/landing/images/document-management-main.png",
                            alt: "Document Management main page showing folders and document organization",
                          },
                          {
                            src: "/landing/images/document-management-create-folder.png",
                            alt: "Create folder modal with access control options",
                          },
                          {
                            src: "/landing/images/document-management-upload.png",
                            alt: "Document upload interface with permissions and sharing options",
                          },
                        ],
                      },
                      {
                        id: "email-system",
                        title: "Email System",
                        steps:
                          "Internal email communication, inbox management, and messaging",
                        images: [
                          {
                            src: "/landing/images/email-system-inbox.png",
                            alt: "Compose email interface with attachments and messaging",
                          },
                          {
                            src: "/landing/images/email-system-notifications.png",
                            alt: "Email notifications showing sent messages and document access indicators",
                          },
                          {
                            src: "/landing/images/email-system-reply.png",
                            alt: "Reply to email interface showing email reply functionality",
                          },
                        ],
                      },
                      {
                        id: "project-management",
                        title: "Project Management & Tracking",
                        steps:
                          "Task tracking, milestones, and team collaboration",
                        images: [
                          {
                            src: "/landing/images/project-management-dashboard.png",
                            alt: "Projects dashboard showing project overview with budget and expenses",
                          },
                          {
                            src: "/landing/images/project-management-create.png",
                            alt: "Create new project modal with project details form",
                          },
                          {
                            src: "/landing/images/project-management-details.png",
                            alt: "Project details page showing milestones and project overview",
                          },
                        ],
                      },
                      {
                        id: "task-performance-management",
                        title: "Task & Performance Management",
                        steps:
                          "Task assignment, performance tracking, and reviews",
                        images: [
                          {
                            src: "/landing/images/task-performance-management.png",
                            alt: "Task management interface with Kanban board and create task modal",
                          },
                          {
                            src: "/landing/images/task-notification.png",
                            alt: "Task assignment notification showing new task assigned to user",
                          },
                          {
                            src: "/landing/images/task-assigned-view.png",
                            alt: "Detailed task view showing assigned task with status, priority, assignees, and task details",
                          },
                        ],
                      },
                      {
                        id: "hr-payroll",
                        title: "Human Resources & Payroll",
                        steps: "Employee management, payroll, and attendance",
                        images: [
                          {
                            src: "/landing/images/hr-attendance.png",
                            alt: "Attendance module showing sign in/out functionality and employee attendance tracking",
                          },
                          {
                            src: "/landing/images/hr-ask-hr.png",
                            alt: "Ask HR module for employees to submit questions to HR department",
                          },
                          {
                            src: "/landing/images/hr-leave-management.png",
                            alt: "Leave management interface for applying and managing employee leave applications",
                          },
                          {
                            src: "/landing/images/hr-loan-management.png",
                            alt: "Loan management system for employee loan applications",
                          },
                          {
                            src: "/landing/images/hr-salary-structure.png",
                            alt: "Salary structure management for creating and managing employee compensation structures",
                          },
                          {
                            src: "/landing/images/hr-payruns-management.png",
                            alt: "Payruns management for generating and managing payroll disbursements",
                          },
                        ],
                      },
                      {
                        id: "news-management",
                        title: "News Management",
                        steps:
                          "Create and publish news articles with organization-wide notifications",
                        images: [
                          {
                            src: "/landing/images/news-management-empty.png",
                            alt: "Company News page showing empty state with description",
                          },
                          {
                            src: "/landing/images/news-management-article.png",
                            alt: "Published news article showing title, author, date, views, and comments",
                          },
                        ],
                      },
                      {
                        id: "data-export",
                        title: "Data Export",
                        steps:
                          "Download and export application data in CSV format for reporting and analysis",
                        image: "/landing/images/data-export-center.png",
                      },
                    ].map((tutorial) => (
                      <div
                        key={tutorial.id || tutorial.title}
                        id={tutorial.id || undefined}
                        className="scroll-mt-20 rounded-lg border p-6"
                      >
                        <h4 className="mb-3 text-lg font-semibold">
                          {tutorial.title}
                        </h4>
                        <p className="mb-4 text-sm text-muted-foreground">
                          {tutorial.steps}
                        </p>
                        {tutorial.images ? (
                          <div className="space-y-4">
                            {tutorial.images.map(
                              (img: { src: string; alt: string }) => (
                                <div
                                  key={img.src}
                                  className="overflow-hidden rounded-lg border"
                                >
                                  <Image
                                    src={img.src}
                                    alt={img.alt}
                                    width={1200}
                                    height={800}
                                    className="h-auto w-full"
                                  />
                                </div>
                              ),
                            )}
                          </div>
                        ) : (
                          <div className="overflow-hidden rounded-lg border">
                            <Image
                              src={tutorial.image || "/placeholder.svg"}
                              alt={tutorial.title}
                              width={1200}
                              height={800}
                              className="h-auto w-full"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Additional Resources */}
        <section className="container mx-auto px-4 py-12 md:px-6 md:py-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-8 text-3xl font-bold">Additional Resources</h2>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="p-6">
                <FileText className="mb-4 h-8 w-8 text-primary" />
                <h3 className="mb-2 text-xl font-semibold">Changelog</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Stay updated with the latest features and improvements
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="#">View Changelog</Link>
                </Button>
              </Card>

              <Card className="p-6">
                <HelpCircle className="mb-4 h-8 w-8 text-primary" />
                <h3 className="mb-2 text-xl font-semibold">Need Help?</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Can't find what you're looking for? Contact our support team
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/help">Get Support</Link>
                </Button>
              </Card>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#e8e8e8] bg-[#faf9f7]">
        <div className="container mx-auto px-4 py-16 md:px-6">
          <div className="grid gap-10 md:grid-cols-4">
            <div>
              <div className="mb-6 flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary shadow-md">
                  <span className="text-xl font-extrabold text-primary-foreground">
                    C
                  </span>
                </div>
                <span className="text-2xl font-extrabold tracking-tight">
                  CAVE ERP
                </span>
              </div>
              <p className="text-base leading-relaxed text-muted-foreground">
                The complete operating system for your organization
              </p>
            </div>

            <div>
              <h3 className="mb-6 text-base font-bold tracking-tight">
                Product
              </h3>
              <ul className="space-y-3 text-base">
                <li>
                  <Link
                    href="/#features"
                    className="text-muted-foreground hover:text-foreground font-medium transition-colors"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#pricing"
                    className="text-muted-foreground hover:text-foreground font-medium transition-colors"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href="/documentation"
                    className="text-muted-foreground hover:text-foreground font-medium transition-colors"
                  >
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-muted-foreground hover:text-foreground font-medium transition-colors"
                  >
                    API
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-6 text-base font-bold tracking-tight">
                Support
              </h3>
              <ul className="space-y-3 text-base">
                <li>
                  <Link
                    href="/help"
                    className="text-muted-foreground hover:text-foreground font-medium transition-colors"
                  >
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-muted-foreground hover:text-foreground font-medium transition-colors"
                  >
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-muted-foreground hover:text-foreground font-medium transition-colors"
                  >
                    Community
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-muted-foreground hover:text-foreground font-medium transition-colors"
                  >
                    Status
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-6 text-base font-bold tracking-tight">
                Company
              </h3>
              <ul className="space-y-3 text-base">
                <li>
                  <Link
                    href="#"
                    className="text-muted-foreground hover:text-foreground font-medium transition-colors"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-muted-foreground hover:text-foreground font-medium transition-colors"
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-muted-foreground hover:text-foreground font-medium transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-muted-foreground hover:text-foreground font-medium transition-colors"
                  >
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t border-[#e8e8e8] pt-8 text-center">
            <p className="text-base font-medium text-muted-foreground">
              &copy; 2025 CAVE ERP. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
