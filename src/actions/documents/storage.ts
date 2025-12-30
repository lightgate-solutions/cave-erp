"use server";

import { getOrganizationStorage } from "@/lib/storage-utils";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function getStorageUsage() {
    try {
        const organization = await auth.api.getFullOrganization({
            headers: await headers(),
        });

        if (!organization) {
            return {
                success: null,
                error: "Organization not found",
            };
        }

        const storageInfo = await getOrganizationStorage(organization.id);

        if (!storageInfo) {
            return {
                success: null,
                error: "Could not retrieve storage information",
            };
        }

        return {
            success: storageInfo,
            error: null,
        };
    } catch (error) {
        console.error("Error fetching storage usage:", error);
        return {
            success: null,
            error: "Failed to fetch storage usage",
        };
    }
}
