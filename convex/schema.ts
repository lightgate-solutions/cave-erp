import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  notifications: defineTable({
    userId: v.union(v.string(), v.number()),
    organizationId: v.optional(v.string()),
    title: v.string(),
    message: v.string(),
    notificationType: v.union(
      v.literal("approval"),
      v.literal("deadline"),
      v.literal("message"),
      v.literal("warning"),
    ),
    createdBy: v.union(v.string(), v.number()),
    referenceId: v.optional(v.number()),
    isRead: v.boolean(),
  })
    .index("by_user_and_org", ["userId", "organizationId"])
    .index("by_organization", ["organizationId"])
    .index("by_user_unread", ["userId", "isRead", "organizationId"]),
});
