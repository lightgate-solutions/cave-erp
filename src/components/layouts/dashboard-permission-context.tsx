"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { UserPermissionContext } from "@/lib/permissions/types";

const DashboardPermissionContext = createContext<UserPermissionContext | null>(
  null,
);

export function DashboardPermissionProvider({
  value,
  children,
}: {
  value: UserPermissionContext | null;
  children: ReactNode;
}) {
  return (
    <DashboardPermissionContext.Provider value={value}>
      {children}
    </DashboardPermissionContext.Provider>
  );
}

export function useDashboardPermission(): UserPermissionContext | null {
  return useContext(DashboardPermissionContext);
}
