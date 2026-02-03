"use server";

import { db } from "@/db";
import { payablesTaxConfig, vendorCustomCategories } from "@/db/schema";
import {
  requirePayablesViewAccess,
  requirePayablesWriteAccess,
} from "../auth/dal-payables";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import type { BillTaxType } from "@/types/payables";

/**
 * Tax Configuration Management
 */

export interface CreateTaxConfigInput {
  taxType: BillTaxType;
  taxName: string;
  defaultRate: number;
  description?: string;
  isActive?: boolean;
}

export interface UpdateTaxConfigInput {
  taxName?: string;
  defaultRate?: number;
  description?: string;
  isActive?: boolean;
}

/**
 * Create a tax configuration
 */
export async function createTaxConfig(data: CreateTaxConfigInput) {
  try {
    await requirePayablesWriteAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return {
        success: null,
        error: { reason: "Organization not found" },
      };
    }

    const [taxConfig] = await db
      .insert(payablesTaxConfig)
      .values({
        taxType: data.taxType,
        taxName: data.taxName,
        defaultRate: data.defaultRate.toString(),
        description: data.description || null,
        isActive: data.isActive ?? true,
        organizationId: organization.id,
      })
      .returning();

    revalidatePath("/payables/settings");

    return {
      success: { data: taxConfig },
      error: null,
    };
  } catch (error) {
    console.error("Error creating tax config:", error);
    return {
      success: null,
      error: { reason: "Failed to create tax configuration" },
    };
  }
}

/**
 * Update a tax configuration
 */
export async function updateTaxConfig(id: number, data: UpdateTaxConfigInput) {
  try {
    await requirePayablesWriteAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return {
        success: null,
        error: { reason: "Organization not found" },
      };
    }

    // Check if tax config exists
    const [existing] = await db
      .select()
      .from(payablesTaxConfig)
      .where(
        and(
          eq(payablesTaxConfig.id, id),
          eq(payablesTaxConfig.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (!existing) {
      return {
        success: null,
        error: { reason: "Tax configuration not found" },
      };
    }

    const updateData: Partial<typeof payablesTaxConfig.$inferInsert> = {};
    if (data.taxName !== undefined) updateData.taxName = data.taxName;
    if (data.defaultRate !== undefined)
      updateData.defaultRate = data.defaultRate.toString();
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const [updated] = await db
      .update(payablesTaxConfig)
      .set(updateData)
      .where(
        and(
          eq(payablesTaxConfig.id, id),
          eq(payablesTaxConfig.organizationId, organization.id),
        ),
      )
      .returning();

    revalidatePath("/payables/settings");

    return {
      success: { data: updated },
      error: null,
    };
  } catch (error) {
    console.error("Error updating tax config:", error);
    return {
      success: null,
      error: { reason: "Failed to update tax configuration" },
    };
  }
}

/**
 * Delete a tax configuration
 */
export async function deleteTaxConfig(id: number) {
  try {
    await requirePayablesWriteAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return {
        success: null,
        error: { reason: "Organization not found" },
      };
    }

    // Check if tax config exists
    const [existing] = await db
      .select()
      .from(payablesTaxConfig)
      .where(
        and(
          eq(payablesTaxConfig.id, id),
          eq(payablesTaxConfig.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (!existing) {
      return {
        success: null,
        error: { reason: "Tax configuration not found" },
      };
    }

    await db
      .delete(payablesTaxConfig)
      .where(
        and(
          eq(payablesTaxConfig.id, id),
          eq(payablesTaxConfig.organizationId, organization.id),
        ),
      );

    revalidatePath("/payables/settings");

    return {
      success: { reason: "Tax configuration deleted successfully" },
      error: null,
    };
  } catch (error) {
    console.error("Error deleting tax config:", error);
    return {
      success: null,
      error: { reason: "Failed to delete tax configuration" },
    };
  }
}

/**
 * Get all tax configurations
 */
export async function getAllTaxConfigs(includeInactive = false) {
  try {
    await requirePayablesViewAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return [];
    }

    const conditions = [eq(payablesTaxConfig.organizationId, organization.id)];

    if (!includeInactive) {
      conditions.push(eq(payablesTaxConfig.isActive, true));
    }

    const taxConfigs = await db
      .select()
      .from(payablesTaxConfig)
      .where(and(...conditions))
      .orderBy(payablesTaxConfig.taxType, payablesTaxConfig.taxName);

    return taxConfigs;
  } catch (error) {
    console.error("Error fetching tax configurations:", error);
    return [];
  }
}

/**
 * Get a single tax configuration
 */
export async function getTaxConfig(id: number) {
  try {
    await requirePayablesViewAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return null;
    }

    const [taxConfig] = await db
      .select()
      .from(payablesTaxConfig)
      .where(
        and(
          eq(payablesTaxConfig.id, id),
          eq(payablesTaxConfig.organizationId, organization.id),
        ),
      )
      .limit(1);

    return taxConfig || null;
  } catch (error) {
    console.error("Error fetching tax configuration:", error);
    return null;
  }
}

/**
 * Custom Vendor Categories Management
 */

export interface CreateCustomCategoryInput {
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateCustomCategoryInput {
  name?: string;
  description?: string;
  isActive?: boolean;
}

/**
 * Create a custom vendor category
 */
export async function createCustomCategory(data: CreateCustomCategoryInput) {
  try {
    await requirePayablesWriteAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return {
        success: null,
        error: { reason: "Organization not found" },
      };
    }

    // Check if category name already exists
    const [existing] = await db
      .select()
      .from(vendorCustomCategories)
      .where(
        and(
          eq(vendorCustomCategories.organizationId, organization.id),
          eq(vendorCustomCategories.name, data.name),
        ),
      )
      .limit(1);

    if (existing) {
      return {
        success: null,
        error: { reason: "Category with this name already exists" },
      };
    }

    const [category] = await db
      .insert(vendorCustomCategories)
      .values({
        name: data.name,
        description: data.description || null,
        isActive: data.isActive ?? true,
        organizationId: organization.id,
      })
      .returning();

    revalidatePath("/payables/settings");
    revalidatePath("/payables/vendors");

    return {
      success: { data: category },
      error: null,
    };
  } catch (error) {
    console.error("Error creating custom category:", error);
    return {
      success: null,
      error: { reason: "Failed to create custom category" },
    };
  }
}

/**
 * Update a custom vendor category
 */
export async function updateCustomCategory(
  id: number,
  data: UpdateCustomCategoryInput,
) {
  try {
    await requirePayablesWriteAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return {
        success: null,
        error: { reason: "Organization not found" },
      };
    }

    // Check if category exists
    const [existing] = await db
      .select()
      .from(vendorCustomCategories)
      .where(
        and(
          eq(vendorCustomCategories.id, id),
          eq(vendorCustomCategories.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (!existing) {
      return {
        success: null,
        error: { reason: "Custom category not found" },
      };
    }

    // If name is being updated, check for duplicates
    if (data.name && data.name !== existing.name) {
      const [duplicate] = await db
        .select()
        .from(vendorCustomCategories)
        .where(
          and(
            eq(vendorCustomCategories.organizationId, organization.id),
            eq(vendorCustomCategories.name, data.name),
          ),
        )
        .limit(1);

      if (duplicate) {
        return {
          success: null,
          error: { reason: "Category with this name already exists" },
        };
      }
    }

    const updateData: Partial<typeof vendorCustomCategories.$inferInsert> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const [updated] = await db
      .update(vendorCustomCategories)
      .set(updateData)
      .where(
        and(
          eq(vendorCustomCategories.id, id),
          eq(vendorCustomCategories.organizationId, organization.id),
        ),
      )
      .returning();

    revalidatePath("/payables/settings");
    revalidatePath("/payables/vendors");

    return {
      success: { data: updated },
      error: null,
    };
  } catch (error) {
    console.error("Error updating custom category:", error);
    return {
      success: null,
      error: { reason: "Failed to update custom category" },
    };
  }
}

/**
 * Delete a custom vendor category
 */
export async function deleteCustomCategory(id: number) {
  try {
    await requirePayablesWriteAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return {
        success: null,
        error: { reason: "Organization not found" },
      };
    }

    // Check if category exists
    const [existing] = await db
      .select()
      .from(vendorCustomCategories)
      .where(
        and(
          eq(vendorCustomCategories.id, id),
          eq(vendorCustomCategories.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (!existing) {
      return {
        success: null,
        error: { reason: "Custom category not found" },
      };
    }

    await db
      .delete(vendorCustomCategories)
      .where(
        and(
          eq(vendorCustomCategories.id, id),
          eq(vendorCustomCategories.organizationId, organization.id),
        ),
      );

    revalidatePath("/payables/settings");
    revalidatePath("/payables/vendors");

    return {
      success: { reason: "Custom category deleted successfully" },
      error: null,
    };
  } catch (error) {
    console.error("Error deleting custom category:", error);
    return {
      success: null,
      error: { reason: "Failed to delete custom category" },
    };
  }
}

/**
 * Get all custom vendor categories
 */
export async function getAllCustomCategories(includeInactive = false) {
  try {
    await requirePayablesViewAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return [];
    }

    const conditions = [
      eq(vendorCustomCategories.organizationId, organization.id),
    ];

    if (!includeInactive) {
      conditions.push(eq(vendorCustomCategories.isActive, true));
    }

    const categories = await db
      .select()
      .from(vendorCustomCategories)
      .where(and(...conditions))
      .orderBy(vendorCustomCategories.name);

    return categories;
  } catch (error) {
    console.error("Error fetching custom categories:", error);
    return [];
  }
}

/**
 * Get a single custom vendor category
 */
export async function getCustomCategory(id: number) {
  try {
    await requirePayablesViewAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return null;
    }

    const [category] = await db
      .select()
      .from(vendorCustomCategories)
      .where(
        and(
          eq(vendorCustomCategories.id, id),
          eq(vendorCustomCategories.organizationId, organization.id),
        ),
      )
      .limit(1);

    return category || null;
  } catch (error) {
    console.error("Error fetching custom category:", error);
    return null;
  }
}
