"use server";
import "server-only";
import { headers } from "next/headers";
import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { employees } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export const verifySession = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user.id) {
    redirect("/auth/login");
  }

  return { isAuth: true, userId: session.user.id, role: session.user.role };
});

export const getUser = cache(async () => {
  const session = await verifySession();
  if (!session.userId) return null;

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    return null;
  }

  const [user] = await db
    .select({
      id: employees.id,
      name: employees.name,
      staffNumber: employees.staffNumber,
      role: employees.role,
      email: employees.email,
      phone: employees.phone,
      department: employees.department,
      managerId: employees.managerId,
      isManager: employees.isManager,
      authId: employees.authId,
    })
    .from(employees)
    .where(
      and(
        eq(employees.authId, session.userId),
        eq(employees.organizationId, organization.id),
      ),
    )
    .limit(1);

  return user;
});

export const getSessionRole = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user?.role ?? null;
});

// Helper to require authentication without redirect (for API-style actions)
export const requireAuth = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user.id) {
    throw new Error("Unauthorized: Authentication required");
  }

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    throw new Error("Unauthorized: Organization not found");
  }

  const [user] = await db
    .select({
      id: employees.id,
      name: employees.name,
      staffNumber: employees.staffNumber,
      role: employees.role,
      email: employees.email,
      phone: employees.phone,
      department: employees.department,
      managerId: employees.managerId,
      isManager: employees.isManager,
    })
    .from(employees)
    .where(
      and(
        eq(employees.authId, session.user.id),
        eq(employees.organizationId, organization.id),
      ),
    )
    .limit(1);

  return { userId: session.user.id, role: session.user.role, employee: user };
});

// Helper to require admin role
export const requireAdmin = cache(async () => {
  const authData = await requireAuth();

  if (authData.role !== "admin") {
    throw new Error("Forbidden: Admin access required");
  }

  return authData;
});

// Helper to require HR or admin role
export const requireHROrAdmin = cache(async () => {
  const authData = await requireAuth();

  if (authData.role !== "admin" && authData.role !== "hr") {
    throw new Error("Forbidden: HR or Admin access required");
  }

  return authData;
});

// Helper to require manager role
export const requireManager = cache(async () => {
  const authData = await requireAuth();

  if (!authData.employee.isManager && authData.role !== "admin") {
    throw new Error("Forbidden: Manager or Admin access required");
  }

  return authData;
});
