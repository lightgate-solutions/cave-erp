"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Code, Settings, Zap, FileText } from "lucide-react";
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
} from "@/components/ui/sidebar";

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
    title: "Tutorials",
    href: "/documentation/tutorials",
    icon: FileText,
  },
  {
    title: "API Reference",
    href: "/documentation/api",
    icon: Code,
  },
];

export function DocumentationSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Documentation</SidebarGroupLabel>
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
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
