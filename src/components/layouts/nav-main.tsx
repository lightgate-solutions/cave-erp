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
import { Badge } from "@/components/ui/badge";

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
    badge?: number;
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
          const isActive =
            item.url === "/"
              ? pathname === "/"
              : pathname?.startsWith(item.url);

          if (hasSubItems) {
            return (
              <Collapsible
                key={item.title}
                asChild
                defaultOpen={isActive}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip={item.title}
                      isActive={isActive}
                      className={cn(
                        "transition-all duration-200",
                        isActive && "font-semibold text-primary",
                      )}
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
                              <Link href={subItem.url}>
                                <span>{subItem.title}</span>
                              </Link>
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
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                tooltip={
                  item.badge && item.badge > 0
                    ? {
                        children: `${item.title} · ${item.badge} unread`,
                      }
                    : item.title
                }
                isActive={isActive}
                className={cn(
                  "transition-all duration-200",
                  isActive && "font-semibold text-primary bg-primary/10",
                )}
              >
                <Link
                  href={item.url}
                  className="flex min-w-0 flex-1 items-center gap-2"
                >
                  {item.icon ? (
                    <span className="relative shrink-0">
                      {React.createElement(item.icon, {
                        className: cn(
                          "h-5 w-5 transition-colors",
                          isActive ? "text-primary" : "text-muted-foreground",
                        ),
                      })}
                      {item.badge != null && item.badge > 0 ? (
                        <span
                          aria-hidden
                          className="absolute -right-0.5 -top-0.5 hidden size-2 rounded-full bg-destructive ring-2 ring-sidebar group-data-[collapsible=icon]:block"
                        />
                      ) : null}
                    </span>
                  ) : null}
                  <span className="truncate">{item.title}</span>
                  {item.badge != null && item.badge > 0 ? (
                    <Badge
                      variant="destructive"
                      className="ml-auto h-5 min-w-5 shrink-0 rounded-full border-0 px-1.5 py-0 text-[10px] font-semibold tabular-nums leading-none group-data-[collapsible=icon]:hidden pointer-events-none shadow-none"
                    >
                      {item.badge > 99 ? "99+" : item.badge}
                    </Badge>
                  ) : null}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
