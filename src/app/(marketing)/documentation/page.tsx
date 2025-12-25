import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { Logo } from "@/components/marketing/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function DocumentationPage() {
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

      <main className="flex-1 bg-background">
        {/* Hero Section */}
        <section className="border-b border-border bg-muted/50 py-16">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="mb-4 text-4xl font-bold md:text-5xl">
                CAVE ERP Documentation
              </h1>
              <p className="mb-8 text-lg text-muted-foreground">
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
                  description: "Learn the basics and set up your first project",
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
                  description: "Step-by-step guides with screenshots",
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
        <section className="border-t border-border bg-background py-12 md:py-16">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto max-w-5xl">
              <h2 className="mb-8 text-3xl font-bold">
                Documentation Categories
              </h2>

              <div className="space-y-8">
                {/* Getting Started */}
                <Card className="p-6">
                  <div className="mb-6 flex items-center gap-3">
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
                        <p className="mt-auto text-sm text-muted-foreground">
                          Install CAVE ERP from web, desktop, or Microsoft Store
                        </p>
                      </div>
                    </Link>
                    <Link href="#first-steps" className="group">
                      <div className="flex h-full flex-col rounded-lg border p-5 transition-colors hover:border-primary">
                        <h4 className="mb-2 font-semibold leading-tight group-hover:text-primary">
                          First Steps
                        </h4>
                        <p className="mt-auto text-sm text-muted-foreground">
                          Create your organization and set up your workspace
                        </p>
                      </div>
                    </Link>
                    <Link href="#user-management" className="group">
                      <div className="flex h-full flex-col rounded-lg border p-5 transition-colors hover:border-primary">
                        <h4 className="mb-2 font-semibold leading-tight group-hover:text-primary">
                          User Management
                        </h4>
                        <p className="mt-auto text-sm text-muted-foreground">
                          Add users, assign roles, and set permissions
                        </p>
                      </div>
                    </Link>
                    <Link href="#dashboard-overview" className="group">
                      <div className="flex h-full flex-col rounded-lg border p-5 transition-colors hover:border-primary">
                        <h4 className="mb-2 font-semibold leading-tight group-hover:text-primary">
                          Dashboard Overview
                        </h4>
                        <p className="mt-auto text-sm text-muted-foreground">
                          Navigate the dashboard and access key features
                        </p>
                      </div>
                    </Link>
                  </div>
                </Card>

                {/* Core Modules */}
                <Card className="p-6">
                  <div className="mb-6 flex items-center gap-3">
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
                        desc: "Track balances, expenses, payruns, and loans",
                        premium: false,
                      },
                      {
                        title: "Human Resources & Payroll",
                        desc: "Manage employees, process payroll, and track attendance",
                        premium: false,
                      },
                      // Project & Task Management
                      {
                        title: "Project Management & Tracking",
                        desc: "Track tasks, milestones, and team collaboration",
                        premium: false,
                      },
                      {
                        title: "Task & Performance Management",
                        desc: "Assign tasks, track performance, and manage workflows",
                        premium: false,
                      },
                      // Document Management
                      {
                        title: "Document Management System",
                        desc: "Organize, store, and share documents securely",
                        premium: false,
                      },
                      {
                        title: "Digital E-Signature & Document Authentication",
                        desc: "Sign documents electronically with secure authentication",
                        premium: true,
                      },
                      // Communication
                      {
                        title: "Email System",
                        desc: "Internal email communication and messaging",
                        premium: false,
                      },
                      {
                        title: "News Management",
                        desc: "Create and publish company-wide announcements",
                        premium: false,
                      },
                      // Operations & Procurement
                      {
                        title: "Procurement & Vendor Management",
                        desc: "Manage purchase orders and vendor relationships",
                        premium: true,
                      },
                      {
                        title: "Asset & Maintenance Management",
                        desc: "Track assets and schedule maintenance",
                        premium: true,
                      },
                      {
                        title: "Manufacturing & Production Planning",
                        desc: "Plan production and manage manufacturing workflows",
                        premium: true,
                      },
                      // Analytics & Compliance
                      {
                        title: "Business Intelligence & Reporting",
                        desc: "Create custom reports and analytics dashboards",
                        premium: true,
                      },
                      {
                        title: "Compliance & Audit Management",
                        desc: "Track audit trails and manage compliance",
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
                  <div className="mb-6 flex items-center gap-3">
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
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <BookOpen className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-2xl font-semibold">
                      Step-by-Step Tutorials
                    </h3>
                  </div>
                  <Accordion type="single" collapsible className="w-full">
                    {[
                      {
                        id: "first-steps",
                        title: "First Steps: Creating Your Organization",
                        summary:
                          "Navigate to settings and click 'Create Organization'. Enter your organization name in the modal. Complete setup in under 2 minutes.",
                        steps:
                          "1. Go to Settings from your profile menu\n2. Click the 'Create Organization' button\n3. Enter your organization name in the modal\n4. Configure billing preferences\n5. Start inviting team members",
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
                        summary:
                          "Invite users via email, assign roles, and customize permissions. Create custom roles for different access levels across modules.",
                        steps:
                          "1. Navigate to User Management from the admin menu\n2. Click 'Invite User' and enter their email\n3. Select a role or create a custom role\n4. Set module-specific permissions\n5. Activate the user account",
                        image: "/landing/images/user-management.png",
                      },
                      {
                        id: "dashboard-overview",
                        title: "Dashboard Overview",
                        summary:
                          "Access key modules from the sidebar. View metrics, tasks, and notifications. Customize widgets based on your role.",
                        steps:
                          "1. Use the left sidebar to navigate between modules\n2. View key metrics and recent activity on the dashboard\n3. Check notifications in the top bar\n4. Customize dashboard widgets via settings\n5. Switch between different views based on your role",
                        image: "/landing/images/dashboard-overview.png",
                      },
                      {
                        id: "financial-management",
                        title: "Financial Management",
                        summary:
                          "Track company balance, record expenses, process payruns, and manage loans. View financial reports and export data.",
                        steps:
                          "1. View company balance and financial overview\n2. Record expenses with receipt attachments\n3. Process employee payruns monthly\n4. Manage employee loan applications\n5. Generate financial reports and export to CSV",
                        image: "/landing/images/finance-management.png",
                      },
                      {
                        id: "document-management",
                        title: "Document Management System",
                        summary:
                          "Organize documents in folders with custom permissions. Upload files, set sharing options, and search easily. Version control included.",
                        steps:
                          "1. Create folders to organize documents\n2. Set folder permissions for different users/teams\n3. Upload files by dragging and dropping\n4. Configure sharing permissions for each document\n5. Use search to quickly find documents",
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
                        summary:
                          "Send messages to individuals or groups. Attach documents, track delivery, and view notifications. All communication stays within CAVE ERP.",
                        steps:
                          "1. Click 'Compose' to start a new message\n2. Select recipients (individuals or groups)\n3. Attach documents from your document library\n4. Send and track message delivery status\n5. View all sent messages and replies in your inbox",
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
                        summary:
                          "Create projects with budgets and timelines. Track milestones, assign team members, and monitor progress. View expenses and generate reports.",
                        steps:
                          "1. Click 'Create Project' and fill in project details\n2. Set budget, timeline, and milestones\n3. Assign team members to the project\n4. Track progress and update task statuses\n5. Monitor expenses against budget and generate reports",
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
                        summary:
                          "Use Kanban boards to manage tasks. Assign with priorities and deadlines. Track progress, add comments, and generate performance reports.",
                        steps:
                          "1. Access the Task Management module\n2. Use the Kanban board to view tasks by status\n3. Create new tasks and assign to team members\n4. Set priorities and deadlines\n5. Track completion rates and generate performance reports",
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
                        summary:
                          "Track attendance, manage leave requests, process loans, define salary structures, and run payroll. All HR functions in one place.",
                        steps:
                          "1. Employees sign in/out to track attendance\n2. Submit leave requests and track balances\n3. Apply for employee loans if needed\n4. HR defines salary structures and benefits\n5. Process monthly payroll runs automatically",
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
                        summary:
                          "Create and publish company announcements. Add rich text, track views, enable comments, and notify all employees automatically.",
                        steps:
                          "1. Click 'Create News' to start a new article\n2. Write your announcement with rich text formatting\n3. Add categories and tags for organization\n4. Publish and automatically notify all employees\n5. Track views and engagement through comments",
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
                        summary:
                          "Export data from any module to CSV. Filter by date, department, or project. Perfect for reporting and analysis.",
                        steps:
                          "1. Navigate to the Data Export Center\n2. Select the module you want to export\n3. Apply filters (date range, department, etc.)\n4. Click 'Export' to generate CSV file\n5. Download and use in Excel or other tools",
                        image: "/landing/images/data-export-center.png",
                      },
                    ].map((tutorial) => (
                      <AccordionItem
                        key={tutorial.id || tutorial.title}
                        value={tutorial.id || tutorial.title}
                        className="scroll-mt-20 border-b border-border"
                      >
                        <AccordionTrigger className="py-6 text-left hover:no-underline [&>svg]:shrink-0">
                          <div className="flex flex-col items-start gap-2 pr-8">
                            <h4 className="text-lg font-semibold leading-tight">
                              {tutorial.title}
                            </h4>
                            <p className="text-sm font-normal leading-relaxed text-muted-foreground">
                              {tutorial.summary}
                            </p>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-6">
                          <div className="space-y-6">
                            {tutorial.steps && (
                              <div className="rounded-lg bg-muted/50 p-4">
                                <h5 className="mb-3 text-sm font-semibold">
                                  Step-by-Step Guide
                                </h5>
                                <ol className="space-y-2.5 text-sm leading-relaxed text-muted-foreground">
                                  {tutorial.steps
                                    .split("\n")
                                    .filter((step) => step.trim())
                                    .map((step, idx) => {
                                      const stepNumber =
                                        step.match(/^\d+\./)?.[0] ||
                                        `${idx + 1}.`;
                                      const stepText = step.replace(
                                        /^\d+\.\s*/,
                                        "",
                                      );
                                      return (
                                        <li
                                          key={`${tutorial.id}-step-${idx}`}
                                          className="flex gap-3"
                                        >
                                          <span className="mt-0.5 shrink-0 font-semibold text-primary">
                                            {stepNumber}
                                          </span>
                                          <span className="flex-1">
                                            {stepText}
                                          </span>
                                        </li>
                                      );
                                    })}
                                </ol>
                              </div>
                            )}
                            {tutorial.images ? (
                              <div className="space-y-4">
                                {tutorial.images.map(
                                  (img: { src: string; alt: string }) => (
                                    <div
                                      key={img.src}
                                      className="overflow-hidden rounded-lg border bg-white"
                                    >
                                      <Image
                                        src={img.src}
                                        alt={img.alt}
                                        width={1200}
                                        height={800}
                                        className="h-auto w-full"
                                      />
                                      {tutorial.images &&
                                        tutorial.images.length > 1 && (
                                          <p className="border-t bg-muted/50 px-4 py-2 text-xs text-muted-foreground">
                                            {img.alt}
                                          </p>
                                        )}
                                    </div>
                                  ),
                                )}
                              </div>
                            ) : (
                              <div className="overflow-hidden rounded-lg border bg-card">
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
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
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
                <h3 className="mb-2 text-xl font-semibold">
                  Changelog & Updates
                </h3>
                <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                  Stay informed about the latest features, improvements, and
                  enhancements we're continuously adding to CAVE ERP. Our
                  changelog documents every update, bug fix, and new feature so
                  you can take full advantage of platform improvements.
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="#">View Changelog</Link>
                </Button>
              </Card>

              <Card className="p-6">
                <HelpCircle className="mb-4 h-8 w-8 text-primary" />
                <h3 className="mb-2 text-xl font-semibold">
                  Need Additional Help?
                </h3>
                <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                  Can't find the answer you're looking for? Our dedicated
                  support team is here to help. Browse our help center for FAQs
                  and guides, or contact us directly for personalized assistance
                  with your specific questions or challenges.
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
      <footer className="border-t border-border bg-muted/50">
        <div className="container mx-auto px-4 py-16 md:px-6">
          <div className="grid gap-10 md:grid-cols-4">
            <div>
              <div className="mb-6">
                <Logo />
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

          <div className="mt-12 border-t border-border pt-8 text-center">
            <p className="text-base font-medium text-muted-foreground">
              &copy; 2025 CAVE ERP. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
