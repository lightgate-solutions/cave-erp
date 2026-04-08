"use server";

import {
  canCreateOrganization,
  getUserPlan,
  getOrgOwnerPlan,
} from "@/lib/plan-utils";
import { db } from "@/db";
import {
  subscriptions,
  organization,
  invitation,
  member,
  employees,
  documentFolders,
  user,
  notification_preferences,
} from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import type { PlanId } from "@/lib/plans";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { generateId } from "better-auth";

export async function validateOrganizationCreation() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !session.user.id) {
    return { canCreate: false, error: "User not authenticated" };
  }

  try {
    const { canCreate, currentCount, limit } = await canCreateOrganization(
      session.user.id,
    );
    const userPlan = await getUserPlan(session.user.id);

    if (!canCreate) {
      const planNames = {
        free: "Free",
        pro: "Pro",
        proAI: "Pro AI",
        premium: "Premium",
        premiumAI: "Premium AI",
      };
      const nextPlan = userPlan === "free" ? "Pro" : "Premium";

      return {
        canCreate: false,
        error: `${planNames[userPlan]} plan allows ${limit === Infinity ? "unlimited" : limit} organization${limit > 1 ? "s" : ""}. You currently have ${currentCount}. Please upgrade to ${nextPlan} to create more organizations.`,
      };
    }

    return { canCreate: true, error: null };
  } catch (error) {
    console.error("Error validating organization creation:", error);
    return {
      canCreate: false,
      error: "Failed to validate organization creation",
    };
  }
}

export async function getOrganizationSubscriptionContext(
  userId: string,
  orgId: string,
) {
  try {
    const userSubscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, userId),
    });

    const org = await db.query.organization.findFirst({
      where: eq(organization.id, orgId),
      columns: { ownerId: true },
    });

    let orgOwnerSubscription = null;
    if (org?.ownerId) {
      orgOwnerSubscription = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.userId, org.ownerId),
      });
    }

    const userPlan = await getUserPlan(userId);
    const orgOwnerPlan = await getOrgOwnerPlan(orgId);

    return {
      success: true,
      data: {
        userSubscription: userSubscription || null,
        userPlan: userPlan as PlanId,
        orgOwnerSubscription: orgOwnerSubscription || null,
        orgOwnerPlan: orgOwnerPlan as PlanId,
      },
      error: null,
    };
  } catch (error) {
    console.error("Error fetching organization subscription context:", error);
    return {
      success: false,
      data: null,
      error: "Failed to fetch subscription context",
    };
  }
}

export async function acceptInvitationAndCreateEmployee(invitationId: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user.id) {
      return {
        success: false,
        error: "User not authenticated",
      };
    }

    // Get the invitation details before accepting
    const inviteDetails = await db.query.invitation.findFirst({
      where: eq(invitation.id, invitationId),
    });

    if (!inviteDetails) {
      return {
        success: false,
        error: "Invitation not found",
      };
    }

    // Check if invitation is still pending
    if (inviteDetails.status !== "pending") {
      return {
        success: false,
        error: "Invitation has already been processed",
      };
    }

    // Check if invitation has expired
    if (inviteDetails.expiresAt < new Date()) {
      return {
        success: false,
        error: "Invitation has expired",
      };
    }

    // Verify the invitation was sent to the authenticated user's email
    if (session.user.email !== inviteDetails.email) {
      return {
        success: false,
        error: "This invitation was not sent to your email address",
      };
    }

    // Perform all operations in a single atomic transaction
    // This ensures either ALL operations succeed or ALL fail together
    const result = await db.transaction(async (tx) => {
      // 1. Create employee record with the department from invitation
      const [emp] = await tx
        .insert(employees)
        .values({
          name: session.user.name,
          email: session.user.email,
          authId: session.user.id,
          phone: "",
          staffNumber: "",
          role: "user",
          isManager: false,
          status: "active",
          department: inviteDetails.department as
            | "hr"
            | "admin"
            | "finance"
            | "operations",
          managerId: null,
          dateOfBirth: null,
          documentCount: 0,
          address: null,
          maritalStatus: null,
          employmentType: null,
          organizationId: inviteDetails.organizationId,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      // 2. Create personal document folder for the employee
      await tx.insert(documentFolders).values({
        name: "personal",
        createdBy: emp.authId,
        department: emp.department,
        root: true,
        status: "active",
        public: false,
        departmental: false,
        organizationId: inviteDetails.organizationId,
      });

      // 3. Update user role
      await tx
        .update(user)
        .set({ role: "user" })
        .where(eq(user.id, session.user.id));

      // 4. Create notification preferences
      await tx.insert(notification_preferences).values({
        user_id: emp.authId,
        email_notifications: true,
        in_app_notifications: true,
        email_on_in_app_message: true,
        email_on_task_notification: false,
        email_on_general_notification: false,
        notify_on_message: true,
        organizationId: inviteDetails.organizationId,
      });

      // 5. Create member record (this is what Better Auth does internally)
      await tx.insert(member).values({
        id: generateId(),
        organizationId: inviteDetails.organizationId,
        userId: session.user.id,
        role: inviteDetails.role || "member",
        createdAt: new Date(),
      });

      // 6. Update invitation status to accepted
      await tx
        .update(invitation)
        .set({ status: "accepted" })
        .where(eq(invitation.id, invitationId));

      // 7. Increment organization members count
      await tx
        .update(organization)
        .set({
          membersCount: sql`COALESCE(${organization.membersCount}, 0) + 1`,
        })
        .where(eq(organization.id, inviteDetails.organizationId));

      return { organizationId: inviteDetails.organizationId };
    });

    return {
      success: true,
      organizationId: result.organizationId,
    };
  } catch (error) {
    console.error("Error accepting invitation and creating employee:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to accept invitation and create employee record",
    };
  }
}
