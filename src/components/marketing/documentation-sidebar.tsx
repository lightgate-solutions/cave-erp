"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Code,
  Settings,
  Zap,
  FileText,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { tutorials } from "@/lib/tutorials-data";

const navigationItems = [
  {
    title: "Overview",
    href: "/documentation",
    icon: BookOpen,
  },
  {
    title: "Getting Started",
    href: "/documentation/getting-started",
    icon: Zap,
  },
  {
    title: "Modules",
    href: "/documentation/modules",
    icon: Settings,
  },
  {
    title: "API Reference",
    href: "/documentation/api",
    icon: Code,
  },
];

export function DocumentationSidebar() {
  const pathname = usePathname();
  const isTutorialsActive = pathname?.startsWith("/documentation/tutorials");
  const tutorialsHref = "/documentation/tutorials";

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarContent>
        {/* Home Button */}
        <div className="p-2 border-b border-border/50">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10 text-primary font-medium transition-all duration-200 hover:shadow-md group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
            <span className="text-sm font-semibold">Back to Home</span>
          </Link>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-foreground font-semibold text-sm uppercase tracking-wider px-3 py-2 mb-2">
            Documentation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}

              {/* Tutorials with Sub-items */}
              <Collapsible
                asChild
                defaultOpen={isTutorialsActive}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip="Tutorials"
                      isActive={isTutorialsActive}
                      className={cn(
                        "transition-all duration-200",
                        isTutorialsActive && "font-semibold text-primary",
                      )}
                    >
                      <FileText />
                      <span>Tutorials</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          isActive={pathname === tutorialsHref}
                        >
                          <a href={tutorialsHref}>
                            <span>All Tutorials</span>
                          </a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      {tutorials.map((tutorial) => {
                        const tutorialHref = `/documentation/tutorials/${tutorial.id}`;
                        const isSubActive = pathname === tutorialHref;
                        return (
                          <SidebarMenuSubItem key={tutorial.id}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={isSubActive}
                              className={cn(
                                "transition-colors",
                                isSubActive &&
                                  "font-medium text-primary bg-primary/10",
                              )}
                            >
                              <a href={tutorialHref}>
                                <span>{tutorial.title}</span>
                              </a>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
