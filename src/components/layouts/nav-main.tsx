import { ChevronRight, type LucideIcon } from "lucide-react";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import React from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function NavMain({
  items,
  label,
  unreadCount = 0,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
  label?: string;
  unreadCount?: number;
}) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarMenu>
        {items.map((item) => {
          const hasSubItems = item.items && item.items.length > 0;

          // More precise active state logic:
          // - For root "/", only match exact
          // - For items with sub-items, check if any sub-item URL matches
          // - For items without sub-items, use exact match or path prefix but exclude nested module routes
          let isActive = false;
          if (item.url === "/") {
            isActive = pathname === "/";
          } else if (hasSubItems) {
            // Check if the current path matches any of the sub-items
            isActive =
              item.items?.some(
                (subItem) =>
                  pathname === subItem.url ||
                  pathname?.startsWith(`${subItem.url}/`),
              ) || false;
          } else {
            // For direct links, check exact match or if it's a child route
            // But exclude routes that belong to other modules (like /finance/payables belongs to Payables, not Finance)
            const isExactMatch = pathname === item.url;
            const isChildRoute = pathname?.startsWith(`${item.url}/`) || false;

            // Special case: /finance should not be active when on /finance/payables
            if (
              item.url === "/finance" &&
              pathname?.startsWith("/finance/payables")
            ) {
              isActive = false;
            } else {
              isActive = isExactMatch || isChildRoute;
            }
          }

          if (hasSubItems) {
            return (
              <Collapsible
                key={item.title}
                asChild
                defaultOpen={isActive}
                className="group/collapsible"
              >
                <SidebarMenuItem suppressHydrationWarning>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip={item.title}
                      isActive={isActive}
                      className={cn(
                        "transition-all duration-200",
                        isActive && "font-semibold text-primary",
                      )}
                      suppressHydrationWarning
                    >
                      {/* {item.icon && <item.icon />} */}

                      {item.title === "Notifications" ? (
                        <div className="relative">
                          {item.icon &&
                            React.createElement(item.icon, {
                              className: cn(
                                "h-5 w-5 transition-colors",
                                isActive
                                  ? "text-primary"
                                  : "text-muted-foreground",
                              ),
                            })}
                          {unreadCount > 0 && (
                            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500" />
                          )}
                        </div>
                      ) : (
                        item.icon &&
                        React.createElement(item.icon, {
                          className: cn(
                            "h-5 w-5 transition-colors",
                            isActive ? "text-primary" : "text-muted-foreground",
                          ),
                        })
                      )}
                      <span>{item.title}</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((subItem) => {
                        const isSubActive = pathname === subItem.url;
                        return (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={isSubActive}
                              className={cn(
                                "transition-colors",
                                isSubActive &&
                                  "font-medium text-primary bg-primary/10",
                              )}
                            >
                              <a href={subItem.url}>
                                <span>{subItem.title}</span>
                              </a>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            );
          }

          // 📌 CASE 2: Item without subitems (direct link)
          return (
            <SidebarMenuItem key={item.title} suppressHydrationWarning>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                isActive={isActive}
                className={cn(
                  "transition-all duration-200",
                  isActive && "font-semibold text-primary bg-primary/10",
                )}
                suppressHydrationWarning
              >
                <Link href={item.url} className="flex items-center">
                  {item.icon &&
                    React.createElement(item.icon, {
                      className: cn(
                        "h-5 w-5 transition-colors",
                        isActive ? "text-primary" : "text-muted-foreground",
                      ),
                    })}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
