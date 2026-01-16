"use server";

import { db } from "@/db";
import { companyBankAccounts } from "@/db/schema";
import {
  requireFinanceOrAdmin,
  requireInvoicingViewAccess,
} from "../auth/dal-invoicing";
import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export type BankAccountInput = {
  accountName: string;
  bankName: string;
  accountNumber: string;
  routingNumber?: string;
  swiftCode?: string;
  currency: string;
  isDefault?: boolean;
  isActive?: boolean;
};

export async function createBankAccount(data: BankAccountInput) {
  try {
    await requireFinanceOrAdmin();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return {
        success: null,
        error: { reason: "Organization not found" },
      };
    }

    // If setting as default, unset other defaults for this currency
    if (data.isDefault) {
      await db
        .update(companyBankAccounts)
        .set({ isDefault: false })
        .where(
          and(
            eq(companyBankAccounts.organizationId, organization.id),
            eq(companyBankAccounts.currency, data.currency),
          ),
        );
    }

    const [account] = await db
      .insert(companyBankAccounts)
      .values({
        ...data,
        organizationId: organization.id,
      })
      .returning();

    revalidatePath("/settings/billing");
    revalidatePath("/invoicing");

    return {
      success: { data: account },
      error: null,
    };
  } catch (error) {
    console.error("Error creating bank account:", error);
    return {
      success: null,
      error: { reason: "Failed to create bank account" },
    };
  }
}

export async function updateBankAccount(
  id: number,
  data: Partial<BankAccountInput>,
) {
  try {
    await requireFinanceOrAdmin();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return {
        success: null,
        error: { reason: "Organization not found" },
      };
    }

    // If setting as default, unset other defaults for this currency
    if (data.isDefault) {
      // We need to know the currency first if it's not in data
      let currency = data.currency;
      if (!currency) {
        const existing = await db.query.companyBankAccounts.findFirst({
          where: eq(companyBankAccounts.id, id),
          columns: { currency: true },
        });
        currency = existing?.currency;
      }

      if (currency) {
        await db
          .update(companyBankAccounts)
          .set({ isDefault: false })
          .where(
            and(
              eq(companyBankAccounts.organizationId, organization.id),
              eq(companyBankAccounts.currency, currency),
            ),
          );
      }
    }

    const [account] = await db
      .update(companyBankAccounts)
      .set(data)
      .where(
        and(
          eq(companyBankAccounts.id, id),
          eq(companyBankAccounts.organizationId, organization.id),
        ),
      )
      .returning();

    revalidatePath("/settings/billing");
    revalidatePath("/invoicing");

    return {
      success: { data: account },
      error: null,
    };
  } catch (error) {
    console.error("Error updating bank account:", error);
    return {
      success: null,
      error: { reason: "Failed to update bank account" },
    };
  }
}

export async function deleteBankAccount(id: number) {
  try {
    await requireFinanceOrAdmin();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return {
        success: null,
        error: { reason: "Organization not found" },
      };
    }

    await db
      .delete(companyBankAccounts)
      .where(
        and(
          eq(companyBankAccounts.id, id),
          eq(companyBankAccounts.organizationId, organization.id),
        ),
      );

    revalidatePath("/settings/billing");
    revalidatePath("/invoicing");

    return {
      success: { reason: "Bank account deleted" },
      error: null,
    };
  } catch (error) {
    console.error("Error deleting bank account:", error);
    // Check for foreign key violation (used in invoices)
    if (
      error instanceof Error &&
      error.message.includes("violates foreign key constraint")
    ) {
      return {
        success: null,
        error: {
          reason: "Cannot delete account used in invoices. Disable it instead.",
        },
      };
    }
    return {
      success: null,
      error: { reason: "Failed to delete bank account" },
    };
  }
}

export async function getBankAccounts() {
  try {
    await requireInvoicingViewAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return [];
    }

    const accounts = await db
      .select()
      .from(companyBankAccounts)
      .where(eq(companyBankAccounts.organizationId, organization.id))
      .orderBy(
        desc(companyBankAccounts.isDefault),
        desc(companyBankAccounts.createdAt),
      );

    return accounts;
  } catch (error) {
    console.error("Error fetching bank accounts:", error);
    return [];
  }
}
