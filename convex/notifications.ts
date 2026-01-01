import { mutation, query } from "./_generated/server";
import * as values from "convex/values";

// Get all notifications for a user (both read and unread)
export const getUserNotifications = query({
  args: {
    userId: values.v.string(),
    organizationId: values.v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notifications")
      .withIndex("by_user_and_org", (q) =>
        q.eq("userId", args.userId).eq("organizationId", args.organizationId),
      )
      .order("desc")
      .collect();
  },
});

// Create a new notification
export const createNotification = mutation({
  args: {
    user_id: values.v.string(),
    created_by: values.v.string(),
    organization_id: values.v.string(),
    title: values.v.string(),
    message: values.v.string(),
    notification_type: values.v.union(
      values.v.literal("approval"),
      values.v.literal("deadline"),
      values.v.literal("message"),
    ),
    reference_id: values.v.optional(values.v.number()),
    is_read: values.v.optional(values.v.boolean()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("notifications", {
      userId: args.user_id,
      organizationId: args.organization_id,
      title: args.title,
      message: args.message,
      notificationType: args.notification_type,
      referenceId: args.reference_id,
      isRead: args.is_read ?? false,
      createdBy: args.created_by,
    });
  },
});

// Mark a single notification as read
export const markAsRead = mutation({
  args: {
    id: values.v.id("notifications"),
    userId: values.v.string(),
    organizationId: values.v.string(),
  },
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.id);
    if (!notification) {
      throw new Error("Notification not found");
    }
    if (
      notification.userId !== args.userId ||
      notification.organizationId !== args.organizationId
    ) {
      throw new Error(
        "Unauthorized: Cannot modify notification from different organization",
      );
    }

    await ctx.db.patch(args.id, { isRead: true });
  },
});

// Mark multiple notifications as read
export const markNotificationsAsRead = mutation({
  args: {
    ids: values.v.array(values.v.id("notifications")),
    userId: values.v.string(),
    organizationId: values.v.string(),
  },
  handler: async (ctx, args) => {
    const { ids } = args;
    for (const id of ids) {
      const notification = await ctx.db.get(id);
      if (!notification) continue;

      if (
        notification.userId !== args.userId ||
        notification.organizationId !== args.organizationId
      ) {
        throw new Error("Unauthorized");
      }

      await ctx.db.patch(id, { isRead: true });
    }
  },
});

// Mark all notifications as read for a user
export const markAllAsRead = mutation({
  args: {
    userId: values.v.string(),
    organizationId: values.v.string(),
  },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q) =>
        q
          .eq("userId", args.userId)
          .eq("isRead", false)
          .eq("organizationId", args.organizationId),
      )
      .collect();

    for (const notification of notifications) {
      await ctx.db.patch(notification._id, { isRead: true });
    }
  },
});

// Delete a single notification
export const deleteNotification = mutation({
  args: {
    id: values.v.id("notifications"),
    userId: values.v.string(),
    organizationId: values.v.string(),
  },
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.id);
    if (!notification) {
      throw new Error("Notification not found");
    }

    if (
      notification.userId !== args.userId ||
      notification.organizationId !== args.organizationId
    ) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.id);
  },
});

// Delete all notifications for a user
export const clearAllNotifications = mutation({
  args: {
    userId: values.v.string(),
    organizationId: values.v.string(),
  },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_org", (q) =>
        q.eq("userId", args.userId).eq("organizationId", args.organizationId),
      )
      .collect();

    for (const notification of notifications) {
      await ctx.db.delete(notification._id);
    }
  },
});

// Get unread notification count for a user
export const getUnreadCount = query({
  args: {
    userId: values.v.string(),
    organizationId: values.v.string(),
  },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q) =>
        q
          .eq("userId", args.userId)
          .eq("isRead", false)
          .eq("organizationId", args.organizationId),
      )
      .collect();

    return notifications.length;
  },
});
