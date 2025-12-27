"use client";

import { DocumentationSidebar } from "@/components/marketing/documentation-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function DocumentationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Sidebar Layout - No Header Navigation */}
      <SidebarProvider>
        <DocumentationSidebar />
        <SidebarInset>
          <main className="flex-1 bg-background">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
