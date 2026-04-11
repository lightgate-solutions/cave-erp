"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  Landmark,
  History,
  BookOpen,
  ArrowDownToLine,
  ArrowUpFromLine,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

interface FinanceSidebarProps {
  isCollapsed: boolean;
}

type FinanceNavLink = {
  title: string;
  icon: LucideIcon;
  href: string;
  /** When true, only `pathname === href` is active */
  exact?: boolean;
};

type FinanceNavGroup = {
  label: string;
  links: FinanceNavLink[];
};

const navGroups: FinanceNavGroup[] = [
  {
    label: "Operations",
    links: [
      {
        title: "Overview",
        icon: LayoutDashboard,
        href: "/finance",
        exact: true,
      },
      {
        title: "Expenses",
        icon: Receipt,
        href: "/finance/expenses",
      },
      {
        title: "Payruns",
        icon: Wallet,
        href: "/finance/payruns",
      },
      {
        title: "Loans",
        icon: Landmark,
        href: "/finance/loans",
      },
      {
        title: "Balance History",
        icon: History,
        href: "/finance/balance/history",
      },
    ],
  },
  {
    label: "Ledger & partners",
    links: [
      {
        title: "General ledger",
        icon: BookOpen,
        href: "/finance/gl",
      },
      {
        title: "Receivables",
        icon: ArrowDownToLine,
        href: "/invoicing",
      },
      {
        title: "Payables",
        icon: ArrowUpFromLine,
        href: "/payables",
      },
    ],
  },
];

function linkIsActive(pathname: string | null, link: FinanceNavLink): boolean {
  if (!pathname) return false;
  if (link.exact) return pathname === link.href;
  return pathname === link.href || pathname.startsWith(`${link.href}/`);
}

export function FinanceSidebar({ isCollapsed }: FinanceSidebarProps) {
  const pathname = usePathname();

  return (
    <TooltipProvider delayDuration={0}>
      <div
        data-collapsed={isCollapsed}
        className="group flex flex-col gap-1 py-2 data-[collapsed=true]:py-2"
      >
        <nav className="grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
          {navGroups.map((group, groupIndex) => (
            <div key={group.label} className="contents">
              {groupIndex > 0 &&
                (isCollapsed ? (
                  <Separator className="my-2 opacity-60" />
                ) : (
                  <div className="pt-3 pb-1">
                    <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {group.label}
                    </p>
                  </div>
                ))}
              {groupIndex === 0 && !isCollapsed ? (
                <div className="pb-1">
                  <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {group.label}
                  </p>
                </div>
              ) : null}
              {group.links.map((link) => {
                const isActive = linkIsActive(pathname, link);

                if (isCollapsed) {
                  return (
                    <Tooltip key={link.href + link.title}>
                      <TooltipTrigger asChild>
                        <Link
                          href={link.href}
                          className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
                            isActive &&
                              "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary",
                          )}
                        >
                          <link.icon className="h-4 w-4" />
                          <span className="sr-only">{link.title}</span>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent
                        side="right"
                        className="flex items-center gap-4"
                      >
                        {link.title}
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                return (
                  <Link
                    key={link.href + link.title}
                    href={link.href}
                    className={cn(
                      "flex items-center justify-between whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                      isActive
                        ? "bg-primary/10 text-primary hover:bg-primary/20"
                        : "hover:bg-muted hover:text-accent-foreground",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <link.icon className="h-4 w-4 shrink-0" />
                      <span>{link.title}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </div>
    </TooltipProvider>
  );
}
