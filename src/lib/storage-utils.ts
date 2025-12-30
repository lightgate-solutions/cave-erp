import { db } from "@/db";
import { organization } from "@/db/schema/auth";
import { document, documentVersions } from "@/db/schema/documents";
import { eq, and, sql } from "drizzle-orm";
import { getPlanLimits, type PlanId } from "./plans";

export interface StorageInfo {
    usedMb: number;
    quotaMb: number;
    availableMb: number;
    usagePercentage: number;
    isAtLimit: boolean;
    isApproachingLimit: boolean; // >80%
}

/**
 * Get organization's current storage usage and quota
 */
export async function getOrganizationStorage(
    organizationId: string,
): Promise<StorageInfo | null> {
    try {
        const org = await db.query.organization.findFirst({
            where: eq(organization.id, organizationId),
            columns: {
                storageUsedMb: true,
                storageQuotaMb: true,
            },
        });

        if (!org) return null;

        const usedMb = org.storageUsedMb || 0;
        const quotaMb = org.storageQuotaMb || 500;
        const availableMb = Math.max(0, quotaMb - usedMb);
        const usagePercentage = quotaMb > 0 ? (usedMb / quotaMb) * 100 : 0;

        return {
            usedMb,
            quotaMb,
            availableMb,
            usagePercentage,
            isAtLimit: usedMb >= quotaMb,
            isApproachingLimit: usagePercentage >= 80,
        };
    } catch (error) {
        console.error("Error fetching organization storage:", error);
        return null;
    }
}

/**
 * Calculate total storage used by organization from actual file sizes
 */
export async function calculateStorageUsage(
    organizationId: string,
): Promise<number> {
    try {
        const result = await db
            .select({
                totalSizeMb: sql<number>`COALESCE(SUM(CAST(${documentVersions.fileSize} AS NUMERIC)), 0)`,
            })
            .from(documentVersions)
            .innerJoin(document, eq(documentVersions.documentId, document.id))
            .where(
                and(
                    eq(document.organizationId, organizationId),
                    eq(document.status, "active"),
                ),
            );

        return Number(result[0]?.totalSizeMb || 0);
    } catch (error) {
        console.error("Error calculating storage usage:", error);
        return 0;
    }
}

/**
 * Check if uploading files would exceed quota
 */
export function canUploadFiles(
    currentUsageMb: number,
    quotaMb: number,
    newFilesSizeMb: number,
): {
    allowed: boolean;
    reason?: string;
    exceededBy?: number;
} {
    const totalAfterUpload = currentUsageMb + newFilesSizeMb;

    if (totalAfterUpload > quotaMb) {
        return {
            allowed: false,
            reason: `Storage limit exceeded. You have ${formatStorageSize(quotaMb - currentUsageMb)} available, but need ${formatStorageSize(newFilesSizeMb)}.`,
            exceededBy: totalAfterUpload - quotaMb,
        };
    }

    return { allowed: true };
}

/**
 * Get storage quota for a specific plan
 */
export function getStorageQuotaForPlan(planId: PlanId): number {
    const limits = getPlanLimits(planId);
    return limits.maxStorage || 500; // Default to 500 MB if not specified
}

/**
 * Update organization's storage usage
 */
export async function updateOrganizationStorage(
    organizationId: string,
    sizeDeltaMb: number,
): Promise<void> {
    try {
        await db
            .update(organization)
            .set({
                storageUsedMb: sql`GREATEST(0, ${organization.storageUsedMb} + ${sizeDeltaMb})`,
            })
            .where(eq(organization.id, organizationId));
    } catch (error) {
        console.error("Error updating organization storage:", error);
        throw error;
    }
}

/**
 * Sync organization storage quota from subscription plan
 */
export async function syncStorageQuota(
    organizationId: string,
    planId: PlanId,
): Promise<void> {
    try {
        const quotaMb = getStorageQuotaForPlan(planId);

        await db
            .update(organization)
            .set({ storageQuotaMb: quotaMb })
            .where(eq(organization.id, organizationId));
    } catch (error) {
        console.error("Error syncing storage quota:", error);
        throw error;
    }
}

/**
 * Recalculate and sync actual storage usage for an organization
 */
export async function recalculateStorageUsage(
    organizationId: string,
): Promise<number> {
    try {
        const actualUsageMb = await calculateStorageUsage(organizationId);

        await db
            .update(organization)
            .set({ storageUsedMb: Math.round(actualUsageMb) })
            .where(eq(organization.id, organizationId));

        return actualUsageMb;
    } catch (error) {
        console.error("Error recalculating storage usage:", error);
        throw error;
    }
}

/**
 * Format storage size for display (e.g., "500 MB", "10 GB")
 */
export function formatStorageSize(sizeInMb: number): string {
    if (sizeInMb < 1) {
        return `${Math.round(sizeInMb * 1024)} KB`;
    }
    if (sizeInMb < 1024) {
        return `${Math.round(sizeInMb * 10) / 10} MB`;
    }
    return `${Math.round((sizeInMb / 1024) * 10) / 10} GB`;
}

/**
 * Convert bytes to MB
 */
export function bytesToMb(bytes: number): number {
    return bytes / (1024 * 1024);
}

/**
 * Convert string file size (from database) to MB
 */
export function fileSizeToMb(fileSize: string): number {
    return parseFloat(fileSize);
}
