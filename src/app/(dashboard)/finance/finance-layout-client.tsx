"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { FinanceSidebar } from "@/components/finance/finance-sidebar";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Menu } from "lucide-react";

export default function FinanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  /** General ledger lives under /finance/gl; use full width without the ops sidebar. */
  const hideFinanceSidebar = pathname?.startsWith("/finance/gl") ?? false;

  useEffect(() => {
    setMounted(true);
  }, []);

  if (hideFinanceSidebar) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden rounded-xl border bg-background shadow-sm">
        <div className="min-w-0 flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden rounded-xl border bg-background shadow-sm">
      <div
        className={cn(
          "hidden md:block border-r bg-muted/10 transition-all duration-300 ease-in-out relative shrink-0",
          isCollapsed ? "w-[52px]" : "w-64",
        )}
      >
        <FinanceSidebar isCollapsed={isCollapsed} />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-6 h-6 w-6 rounded-full border bg-background shadow-md z-10 hover:bg-accent"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={
            isCollapsed ? "Expand finance menu" : "Collapse finance menu"
          }
        >
          {isCollapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </Button>
      </div>

      <div className="md:hidden flex flex-col min-w-0 flex-1 overflow-hidden">
        <div className="flex shrink-0 items-center gap-2 border-b bg-background px-3 py-2">
          {mounted ? (
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Open finance menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0 pt-6">
                <FinanceSidebar isCollapsed={false} />
              </SheetContent>
            </Sheet>
          ) : (
            <div
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center"
              aria-hidden
            />
          )}
          <span className="text-sm font-medium text-muted-foreground">
            Finance
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </div>

      <div className="hidden md:flex flex-1 flex-col min-w-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 md:p-6">{children}</div>
      </div>
    </div>
  );
}
