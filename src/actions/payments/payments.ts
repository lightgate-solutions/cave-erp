"use server";

import { db } from "@/db";
import { payments } from "@/db/schema/payments";
import { eq, and } from "drizzle-orm";
import { requireAuth, requireHROrAdmin } from "@/actions/auth/dal";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

type PaymentStatus = "pending" | "successful" | "failed";

export async function createPayment(data: {
  payer_name: string;
  account_number: string;
  bank_name?: string;
  amount: string;
  description?: string;
}) {
  await requireAuth();
  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    throw new Error("Organization not found");
  }
  try {
    const parsedAmount = Number(data.amount);
    const [payment] = await db
      .insert(payments)
      .values({
        ...data,
        amount: parsedAmount,
        organizationId: organization.id,
      })
      .returning();
    return payment;
  } catch (_error) {
    throw new Error("Failed to create payment");
  }
}

export async function getAllPayments() {
  await requireAuth();
  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    return [];
  }
  try {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.organizationId, organization.id));
  } catch (_error) {
    throw new Error("Failed to fetch payments");
  }
}

export async function getApprovedPayments() {
  await requireAuth();
  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    return [];
  }
  try {
    return await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.payment_status, "successful"),
          eq(payments.organizationId, organization.id),
        ),
      );
  } catch (_error) {
    throw new Error("Failed to fetch successful payments");
  }
}

export async function updatePaymentStatus(id: string, status: PaymentStatus) {
  await requireHROrAdmin();
  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    throw new Error("Organization not found");
  }
  try {
    await db
      .update(payments)
      .set({ payment_status: status })
      .where(
        and(eq(payments.id, id), eq(payments.organizationId, organization.id)),
      );
  } catch (_error) {
    throw new Error("Failed to update payment status");
  }
}
