import Image from "next/image";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { BookOpen } from "lucide-react";

const tutorials = [
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
];

export default function TutorialsPage() {
  return (
    <div className="container mx-auto px-4 py-12 md:px-6 md:py-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">
              Step-by-Step Tutorials
            </h1>
          </div>
          <p className="text-lg text-foreground/80 leading-relaxed">
            Visual guides with screenshots showing exactly how to use each
            feature
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {tutorials.map((tutorial) => (
            <AccordionItem
              key={tutorial.id || tutorial.title}
              value={tutorial.id || tutorial.title}
              className="scroll-mt-20 border-b border-border"
            >
              <AccordionTrigger className="py-6 text-left hover:no-underline [&>svg]:shrink-0">
                <div className="flex flex-col items-start gap-2 pr-8">
                  <h4 className="text-lg font-semibold leading-tight text-foreground">
                    {tutorial.title}
                  </h4>
                  <p className="text-sm font-normal leading-relaxed text-foreground/70">
                    {tutorial.summary}
                  </p>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-6">
                <div className="space-y-6">
                  {tutorial.steps && (
                    <div className="rounded-lg bg-muted/50 p-4">
                      <h5 className="mb-3 text-sm font-semibold text-foreground">
                        Step-by-Step Guide
                      </h5>
                      <ol className="space-y-2.5 text-sm leading-relaxed text-foreground/80">
                        {tutorial.steps
                          .split("\n")
                          .filter((step) => step.trim())
                          .map((step, idx) => {
                            const stepNumber =
                              step.match(/^\d+\./)?.[0] || `${idx + 1}.`;
                            const stepText = step.replace(/^\d+\.\s*/, "");
                            return (
                              <li
                                key={`${tutorial.id}-step-${idx}`}
                                className="flex gap-3"
                              >
                                <span className="mt-0.5 shrink-0 font-semibold text-primary">
                                  {stepNumber}
                                </span>
                                <span className="flex-1">{stepText}</span>
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
                            className="overflow-hidden rounded-lg border bg-card"
                          >
                            <Image
                              src={img.src}
                              alt={img.alt}
                              width={1200}
                              height={800}
                              className="h-auto w-full"
                            />
                            {tutorial.images && tutorial.images.length > 1 && (
                              <p className="border-t bg-muted/50 px-4 py-2 text-xs text-muted-foreground">
                                {img.alt}
                              </p>
                            )}
                          </div>
                        ),
                      )}
                    </div>
                  ) : (
                    tutorial.image && (
                      <div className="overflow-hidden rounded-lg border bg-card">
                        <Image
                          src={tutorial.image}
                          alt={tutorial.title}
                          width={1200}
                          height={800}
                          className="h-auto w-full"
                        />
                      </div>
                    )
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
