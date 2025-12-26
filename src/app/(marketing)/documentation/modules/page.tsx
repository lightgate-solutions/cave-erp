import { Card } from "@/components/ui/card";
import { Settings, Code } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ModulesPage() {
  const coreModules = [
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
  ];

  const premiumModules = [
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
  ];

  const advancedFeatures = [
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
  ];

  return (
    <div className="container mx-auto px-4 py-12 md:px-6 md:py-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Settings className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">Modules</h1>
          </div>
          <p className="text-lg text-foreground/80 leading-relaxed">
            Explore all available modules and features in CAVE ERP
          </p>
        </div>

        <div className="space-y-12">
          {/* Core Modules */}
          <div>
            <h2 className="mb-6 text-2xl font-semibold text-foreground">
              Core Modules
            </h2>
            <div className="grid gap-5 md:grid-cols-2">
              {coreModules.map((module) => (
                <Card
                  key={module.title}
                  className="flex h-full flex-col p-6 transition-colors hover:border-primary hover:shadow-md"
                >
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <h3 className="flex-1 text-lg font-semibold leading-tight text-foreground">
                      {module.title}
                    </h3>
                    {module.premium && (
                      <Badge variant="secondary" className="shrink-0">
                        Premium
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/70">
                    {module.desc}
                  </p>
                </Card>
              ))}
            </div>
          </div>

          {/* Premium Modules */}
          <div>
            <h2 className="mb-6 text-2xl font-semibold text-foreground">
              Premium Modules
            </h2>
            <div className="grid gap-5 md:grid-cols-2">
              {premiumModules.map((module) => (
                <Card
                  key={module.title}
                  className="flex h-full flex-col p-6 transition-colors hover:border-primary hover:shadow-md"
                >
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <h3 className="flex-1 text-lg font-semibold leading-tight text-foreground">
                      {module.title}
                    </h3>
                    <Badge variant="secondary" className="shrink-0">
                      Premium
                    </Badge>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/70">
                    {module.desc}
                  </p>
                </Card>
              ))}
            </div>
          </div>

          {/* Advanced Features */}
          <div>
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Code className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground">
                Advanced Features
              </h2>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              {advancedFeatures.map((feature) => (
                <Card
                  key={feature.title}
                  className="flex h-full flex-col p-6 transition-colors hover:border-primary hover:shadow-md"
                >
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <h3 className="flex-1 text-lg font-semibold leading-tight text-foreground">
                      {feature.title}
                    </h3>
                    <Badge variant="secondary" className="shrink-0">
                      Premium
                    </Badge>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/70">
                    {feature.desc}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
