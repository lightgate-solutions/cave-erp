/** biome-ignore-all lint/style/useNodejsImportProtocol: <> */

"use server";

import { db } from "@/db";
import {
  invoices,
  invoiceItems,
  subscriptions,
} from "@/db/schema/subscriptions";
import { organization, member } from "@/db/schema/auth";
import { eq, desc, inArray } from "drizzle-orm";
import { getUser } from "./auth/dal";
import { redirect } from "next/navigation";
import {
  calculateAnniversaryDay,
  calculateNextPeriodEnd,
  calculatePlanChangeProration,
} from "@/lib/billing-utils";
import { sendInvoiceEmail } from "@/lib/emails";
import * as crypto from "crypto";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

export async function getSubscriptionDetails() {
  const currentUser = await getUser();
  if (!currentUser || !currentUser.authId) {
    return { subscription: null, error: "User not authenticated" };
  }

  try {
    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, currentUser.authId),
      with: {
        user: {
          columns: {
            name: true,
            email: true,
          },
        },
      },
    });

    return { subscription, error: null };
  } catch (error) {
    console.error("Error fetching subscription details:", error);
    return {
      subscription: null,
      error: "Failed to fetch subscription details",
    };
  }
}

export async function getInvoiceHistory() {
  const currentUser = await getUser();
  if (!currentUser || !currentUser.authId) {
    return { invoices: [], error: "User not authenticated" };
  }

  try {
    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, currentUser.authId),
      columns: {
        id: true,
      },
    });

    if (!subscription) {
      return { invoices: [], error: null };
    }

    const userInvoices = await db.query.invoices.findMany({
      where: eq(invoices.subscriptionId, subscription.id),
      orderBy: [desc(invoices.createdAt)],
      with: {
        items: true,
      },
    });

    return { invoices: userInvoices, error: null };
  } catch (error) {
    console.error("Error fetching invoice history:", error);
    return { invoices: [], error: "Failed to fetch invoice history" };
  }
}

const plans = {
  pro: {
    id: "pro" as const,
    price: 900000,
    pricePerMember: "9000.00",
  },
  proAI: {
    id: "proAI" as const,
    price: 1800000,
    pricePerMember: "18000.00",
  },
  premium: {
    id: "premium" as const,
    price: 4500000,
    pricePerMember: "45000.00",
  },
  premiumAI: {
    id: "premiumAI" as const,
    price: 6000000,
    pricePerMember: "60000.00",
  },
};

/**
 * Creates a Paystack checkout session for paying an invoice.
 * This action constructs a request to the Paystack API and redirects the user
 * to the returned authorization URL.
 *
 * @param invoiceId The ID of the invoice to pay.
 */
export async function payInvoice(invoiceId: string) {
  const currentUser = await getUser();
  if (!currentUser || !currentUser.authId || !currentUser.email) {
    return { error: "User not authenticated or email is missing." };
  }

  // Verify invoice belongs to user
  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, currentUser.authId),
    columns: { id: true },
  });

  if (!subscription) {
    return { error: "No subscription found." };
  }

  const invoice = await db.query.invoices.findFirst({
    where: eq(invoices.id, invoiceId),
    columns: { id: true, amount: true, subscriptionId: true, status: true },
  });

  if (!invoice) {
    return { error: "Invoice not found." };
  }

  if (invoice.subscriptionId !== subscription.id) {
    return { error: "Invoice does not belong to current user." };
  }

  if (invoice.status === "paid") {
    return { error: "Invoice is already paid." };
  }

  const PAYSTACK_API_URL = "https://api.paystack.co/transaction/initialize";
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey) {
    console.error("PAYSTACK_SECRET_KEY is not set in environment variables.");
    return { error: "Server configuration error." };
  }

  const amountInKobo = Math.round(parseFloat(invoice.amount) * 100);

  const transactionData = {
    email: currentUser.email,
    amount: amountInKobo,
    metadata: {
      invoice_id: invoiceId,
      user_id: currentUser.authId,
      type: "invoice-payment",
    },
  };

  let authorizationUrl: string | null = null;

  try {
    const response = await fetch(PAYSTACK_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(transactionData),
    });

    const data = await response.json();

    if (!data.status || !data.data.authorization_url) {
      console.error("Paystack API error:", data.message);
      return { error: `Failed to create checkout session: ${data.message}` };
    }

    authorizationUrl = data.data.authorization_url;
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return {
      error:
        "An unexpected error occurred while contacting the payment provider.",
    };
  }

  if (authorizationUrl) {
    redirect(authorizationUrl);
  }
}

/**
 * Creates a Paystack checkout session for upgrading to a paid plan.
 * This creates/updates the subscription and redirects to payment.
 *
 * @param planId The identifier for the selected plan ('pro' or 'premium').
 */
export async function createCheckoutSession(
  planId: "pro" | "proAI" | "premium" | "premiumAI",
) {
  const currentUser = await getUser();
  if (!currentUser || !currentUser.authId || !currentUser.email) {
    return { error: "User not authenticated or email is missing." };
  }

  const plan = plans[planId];
  if (!plan) {
    return { error: "Invalid plan selected." };
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey) {
    console.error("PAYSTACK_SECRET_KEY is not set in environment variables.");
    return { error: "Server configuration error." };
  }

  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, currentUser.authId),
  });

  const now = new Date();

  const anniversaryDay = calculateAnniversaryDay(now);

  const currentPeriodEnd = calculateNextPeriodEnd(now, anniversaryDay);

  if (!subscription) {
    await db.insert(subscriptions).values({
      id: `sub_${currentUser.authId}_${Date.now()}`,
      userId: currentUser.authId,
      plan: plan.id,
      status: "active",
      pricePerMember: plan.pricePerMember,
      currentPeriodStart: now,
      currentPeriodEnd: currentPeriodEnd,
      billingAnniversaryDay: anniversaryDay,
      lastInvoicedAt: null,
    });
  } else {
    await db
      .update(subscriptions)
      .set({
        plan: plan.id,
        pricePerMember: plan.pricePerMember,
        status: "active",
        currentPeriodStart: now,
        currentPeriodEnd: currentPeriodEnd,
        billingAnniversaryDay: anniversaryDay,
      })
      .where(eq(subscriptions.id, subscription.id));
  }

  redirect("/settings/billing");
}

/**
 * Changes the user's subscription plan.
 * Implements proration for mid-period plan changes.
 *
 * @param newPlanId The identifier for the new plan ('pro' or 'premium').
 */
export async function changePlan(newPlanId: "pro" | "premium") {
  const currentUser = await getUser();
  if (!currentUser || !currentUser.authId || !currentUser.email) {
    return { error: "User not authenticated or email is missing." };
  }

  const newPlan = plans[newPlanId];
  if (!newPlan) {
    return { error: "Invalid plan selected." };
  }

  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, currentUser.authId),
  });

  if (!subscription) {
    return { error: "No subscription found." };
  }

  if (subscription.plan === newPlanId) {
    return { error: "Already on this plan." };
  }

  try {
    const oldPricePerMember = parseFloat(subscription.pricePerMember || "0");
    const newPricePerMember = parseFloat(newPlan.pricePerMember);

    const userOrgs = await db.query.organization.findMany({
      where: eq(organization.ownerId, currentUser.authId),
      columns: { id: true },
    });

    if (userOrgs.length === 0) {
      return { error: "No organizations found for billing." };
    }

    const orgIds = userOrgs.map((o) => o.id);

    const allMembers = await db.query.member.findMany({
      where: inArray(member.organizationId, orgIds),
      columns: { userId: true },
    });

    const uniqueMemberCount = new Set(allMembers.map((m) => m.userId)).size;

    let prorationInvoiceId: string | null = null;
    if (subscription.currentPeriodStart && subscription.currentPeriodEnd) {
      const proration = calculatePlanChangeProration(
        oldPricePerMember,
        newPricePerMember,
        uniqueMemberCount,
        subscription.currentPeriodStart,
        subscription.currentPeriodEnd,
      );

      if (Math.abs(proration.netAmount) > 0.01) {
        const invoiceId = `inv_${crypto.randomUUID()}`;
        const now = new Date();
        const dueDate = dayjs.utc(now).add(14, "days").format("YYYY-MM-DD");

        const [invoice] = await db
          .insert(invoices)
          .values({
            id: invoiceId,
            subscriptionId: subscription.id,
            status: "open",
            amount: String(proration.netAmount.toFixed(2)),
            currency: "NGN",
            billingPeriodStart: now,
            billingPeriodEnd: subscription.currentPeriodEnd,
            dueDate: dueDate,
          })
          .returning();

        const planChangeDescription =
          proration.netAmount > 0
            ? `Plan upgrade: ${subscription.plan} → ${newPlanId} (prorated charge for remaining period)`
            : `Plan downgrade: ${subscription.plan} → ${newPlanId} (prorated credit for remaining period)`;

        await db.insert(invoiceItems).values({
          id: `item_${crypto.randomUUID()}`,
          invoiceId: invoice.id,
          memberId: null,
          organizationId: null,
          description: `${planChangeDescription}\nOld price: ₦${oldPricePerMember.toFixed(2)}/member, New price: ₦${newPricePerMember.toFixed(2)}/member\n${uniqueMemberCount} members × ${proration.remainingDays}/${proration.totalDays} days`,
          amount: String(proration.netAmount.toFixed(2)),
          prorated: true,
          billingPeriodStart: now,
          billingPeriodEnd: subscription.currentPeriodEnd,
        });

        if (proration.netAmount > 0) {
          const paymentLink = await generatePaystackLink({
            email: currentUser.email,
            amount: proration.netAmount,
            invoiceId: invoice.id,
            userId: currentUser.authId,
          });

          await sendInvoiceEmail({
            to: currentUser.email,
            invoiceDetails: {
              invoiceId: invoice.id,
              amount: proration.netAmount,
              dueDate: dueDate,
              items: [
                {
                  description: planChangeDescription,
                  amount: String(proration.netAmount.toFixed(2)),
                },
              ],
              paymentLink: paymentLink,
            },
          });
        }

        prorationInvoiceId = invoice.id;
      }
    }

    await db
      .update(subscriptions)
      .set({
        plan: newPlan.id,
        pricePerMember: newPlan.pricePerMember,
      })
      .where(eq(subscriptions.id, subscription.id));

    return {
      success: true,
      prorationInvoiceId: prorationInvoiceId,
    };
  } catch (error) {
    console.error("Error changing plan:", error);
    return { error: "Failed to change subscription plan." };
  }
}

/**
 * Generates a Paystack payment link for an invoice.
 * @param email User's email address
 * @param amount Amount in NGN
 * @param invoiceId Invoice ID
 * @param userId User ID
 * @returns Paystack authorization URL or fallback billing page URL
 */
async function generatePaystackLink({
  email,
  amount,
  invoiceId,
  userId,
}: {
  email: string;
  amount: number;
  invoiceId: string;
  userId: string;
}): Promise<string> {
  const PAYSTACK_API_URL = "https://api.paystack.co/transaction/initialize";
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey) {
    console.error("PAYSTACK_SECRET_KEY not configured");
    return `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`;
  }

  try {
    const amountInKobo = Math.round(amount * 100);
    const response = await fetch(PAYSTACK_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        amount: amountInKobo,
        metadata: {
          invoice_id: invoiceId,
          user_id: userId,
          type: "invoice-payment",
        },
      }),
    });

    const data = await response.json();
    if (data.status && data.data.authorization_url) {
      return data.data.authorization_url;
    }
  } catch (error) {
    console.error("Error generating Paystack link:", error);
  }

  return `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`;
}

export async function requestSubscriptionCancellation() {
  const currentUser = await getUser();
  if (!currentUser || !currentUser.authId) {
    return { error: "User not authenticated." };
  }

  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, currentUser.authId),
  });

  if (!subscription) {
    return { error: "No subscription found to cancel." };
  }

  try {
    await db
      .update(subscriptions)
      .set({
        status: "canceled",
        cancelAtPeriodEnd: true,
        canceledAt: new Date(),
      })
      .where(eq(subscriptions.id, subscription.id));

    return { success: true };
  } catch (error) {
    console.error("Error requesting subscription cancellation:", error);
    return { error: "Failed to request subscription cancellation." };
  }
}
