"use server";

import { db } from "@/db";
import { glPeriods } from "@/db/schema/general-ledger";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";

const periodSchema = z.object({
  periodName: z.string().min(1),
  startDate: z.date(),
  endDate: z.date(),
  status: z.enum(["Open", "Closed", "Locked"]).default("Open"),
  isYearEnd: z.boolean().default(false),
  organizationId: z.string().min(1),
});

export type PeriodFormValues = z.infer<typeof periodSchema>;

export async function createPeriod(data: {
  periodName: string;
  startDate: Date;
  endDate: Date;
  status?: "Open" | "Closed" | "Locked";
  isYearEnd?: boolean;
  organizationId?: string;
}) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const organizationId = session?.session?.activeOrganizationId;
    if (!organizationId) {
      return { success: false, error: "Unauthorized: No active organization" };
    }
    const validated = periodSchema.parse({
      periodName: data.periodName,
      startDate: data.startDate,
      endDate: data.endDate,
      status: data.status ?? "Open",
      isYearEnd: data.isYearEnd ?? false,
      organizationId,
    }) as PeriodFormValues;

    await db.insert(glPeriods).values({
      organizationId: validated.organizationId,
      periodName: validated.periodName,
      startDate: validated.startDate.toISOString().split("T")[0],
      endDate: validated.endDate.toISOString().split("T")[0],
      status: validated.status,
      isYearEnd: validated.isYearEnd,
    });

    revalidatePath("/finance/gl/settings");
    return { success: true };
  } catch (error) {
    console.error("Failed to create period:", error);
    return { success: false, error: "Failed to create period" };
  }
}

export async function getPeriods(passedOrgId?: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const organizationId =
      session?.session?.activeOrganizationId ?? passedOrgId;
    if (!organizationId) {
      return {
        success: false,
        error: "Unauthorized: No active organization",
        data: [],
      };
    }
    const periods = await db.query.glPeriods.findMany({
      where: eq(glPeriods.organizationId, organizationId),
      orderBy: desc(glPeriods.startDate),
    });
    return { success: true, data: periods };
  } catch (error) {
    console.error("Failed to get periods:", error);
    return { success: false, error: "Failed to get periods", data: [] };
  }
}

export async function updatePeriodStatus(
  id: number,
  status: "Open" | "Closed" | "Locked",
  userId?: string,
  passedOrgId?: string,
  reason?: string,
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const organizationId =
      session?.session?.activeOrganizationId ?? passedOrgId;
    if (!organizationId) {
      return { success: false, error: "Unauthorized: No active organization" };
    }

    const [existing] = await db
      .select()
      .from(glPeriods)
      .where(
        and(eq(glPeriods.id, id), eq(glPeriods.organizationId, organizationId)),
      )
      .limit(1);

    if (!existing) {
      return { success: false, error: "Period not found" };
    }

    const wasRestricted =
      existing.status === "Closed" || existing.status === "Locked";
    const isReopen = status === "Open" && wasRestricted;

    const updateValues: {
      status: typeof status;
      closedBy: string | null;
      lastStatusChangeReason: string | null;
      reopenedAt?: Date | null;
      reopenedBy?: string | null;
    } = {
      status,
      closedBy:
        status === "Closed" || status === "Locked" ? (userId ?? null) : null,
      lastStatusChangeReason: reason?.trim() || null,
    };
    if (isReopen) {
      updateValues.reopenedAt = new Date();
      updateValues.reopenedBy = userId ?? null;
    }

    await db
      .update(glPeriods)
      .set(updateValues)
      .where(
        and(eq(glPeriods.id, id), eq(glPeriods.organizationId, organizationId)),
      );

    revalidatePath("/finance/gl/periods");
    revalidatePath("/finance/gl/reports");
    revalidatePath("/finance/gl/journals");
    return { success: true };
  } catch (error) {
    console.error("Failed to update period status:", error);
    return { success: false, error: "Failed to update period status" };
  }
}
