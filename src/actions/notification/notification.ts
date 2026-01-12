"use server";

import { getUser } from "../auth/dal";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "../../../convex/_generated/api";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

type CreateNotificationInput = {
  user_id: string;
  title: string;
  message: string;
  notification_type: "approval" | "deadline" | "message" | "warning";
  reference_id?: number;
  is_read?: boolean;
  organization_id?: string;
};

export async function createNotification({
  user_id,
  title,
  message,
  notification_type,
  reference_id = 0,
  is_read = false,
  organization_id,
}: CreateNotificationInput) {
  try {
    const currentUser = await getUser();

    if (!currentUser) {
      return {
        success: false,
        data: null,
        error: "Log in to continue",
      };
    }

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return {
        success: false,
        data: null,
        error: "Organization not found",
      };
    }

    const orgId = organization_id ?? organization.id;

    await fetchMutation(api.notifications.createNotification, {
      created_by: currentUser.authId,
      organization_id: orgId,
      title,
      reference_id,
      user_id,
      message,
      notification_type,
      is_read,
    });

    return {
      success: true,
      data: title,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create notification",
    };
  }
}

export async function getUserNotifications() {
  const currentUser = await getUser();
  if (!currentUser) {
    return {
      success: false,
      data: [],
      error: "Log in to continue",
    };
  }

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });

  if (!organization) {
    return {
      success: false,
      data: [],
      error: "Organization not found",
    };
  }

  const userId = currentUser.authId;

  const userNotifications = await fetchQuery(
    api.notifications.getUserNotifications,
    {
      userId,
      organizationId: organization.id,
    },
  );

  return { success: true, data: userNotifications, error: null };
}
