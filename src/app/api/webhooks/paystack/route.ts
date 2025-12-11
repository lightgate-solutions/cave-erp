/** biome-ignore-all lint/suspicious/noExplicitAny: <> */
/** biome-ignore-all lint/style/useNodejsImportProtocol: <> */

import { NextResponse } from "next/server";
import { db } from "@/db";
import { invoices, subscriptions } from "@/db/schema/subscriptions";
import { eq } from "drizzle-orm";
import * as crypto from "crypto";
import { formatPriceForDb, type PlanId } from "@/lib/plans";
import {
  calculateAnniversaryDay,
  calculateNextPeriodEnd,
} from "@/lib/billing-utils";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

/**
 * Verifies the Paystack webhook signature to ensure the request is authentic.
 * @param signature The value of the 'x-paystack-signature' header from the incoming request.
 * @param body The raw request body as a string.
 * @returns {boolean} True if the signature is valid, false otherwise.
 */
function verifyPaystackSignature(signature: string, body: string): boolean {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    console.error("Paystack secret key is not set in environment variables.");
    return false;
  }

  const hash = crypto.createHmac("sha512", secret).update(body).digest("hex");

  return hash === signature;
}

const plans: Record<
  Exclude<PlanId, "free">,
  { id: PlanId; pricePerMember: string }
> = {
  pro: {
    id: "pro" as const,
    pricePerMember: formatPriceForDb("pro"),
  },
  proAI: {
    id: "proAI" as const,
    pricePerMember: formatPriceForDb("proAI"),
  },
  premium: {
    id: "premium" as const,
    pricePerMember: formatPriceForDb("premium"),
  },
  premiumAI: {
    id: "premiumAI" as const,
    pricePerMember: formatPriceForDb("premiumAI"),
  },
};

/**
 * API route for handling Paystack webhooks.
 *
 * This endpoint listens for events from Paystack, verifies their authenticity,
 * and then updates the application's database accordingly.
 *
 * It handles two primary cases for a 'charge.success' event:
 * 1. New Subscriptions: Identified by `metadata.type === 'new-subscription'`.
 * 2. Recurring Invoice Payments: Identified by `metadata.invoice_id`.
 */
export async function POST(request: Request) {
  const signature = request.headers.get("x-paystack-signature");
  const rawBody = await request.text();

  // 1. Verify the webhook signature
  if (!signature || !verifyPaystackSignature(signature, rawBody)) {
    return new Response("Unauthorized: Invalid signature", {
      status: 401,
    });
  }

  const event = JSON.parse(rawBody);

  try {
    // 2. Handle the 'charge.success' event
    if (event.event === "charge.success") {
      const { data } = event;
      const metadata = data?.metadata || {};

      // CASE 1: Handle a new subscription activation
      if (metadata.type === "new-subscription") {
        const {
          user_id: userId,
          plan_id: planId,
          subscription_id: subscriptionId,
        } = metadata;
        const paystackSubscriptionCode = data?.subscription?.subscription_code;
        const plan = plans[planId as "pro" | "premium"];

        if (!userId || !plan || !subscriptionId) {
          console.error(
            "Webhook Error: Missing user_id, plan_id, or subscription_id for new subscription.",
            metadata,
          );
          return NextResponse.json({
            status: "error",
            message: "Missing metadata.",
          });
        }

        const now = new Date();

        // Calculate anniversary day from subscription start
        const anniversaryDay = calculateAnniversaryDay(now);

        // Use anniversary day for period end calculation
        const currentPeriodEnd = calculateNextPeriodEnd(now, anniversaryDay);

        await db
          .update(subscriptions)
          .set({
            status: "active",
            plan: plan.id,
            pricePerMember: plan.pricePerMember,
            currentPeriodStart: now,
            currentPeriodEnd: currentPeriodEnd,
            billingAnniversaryDay: anniversaryDay,
            trialEnd: null,
            paystackSubscriptionCode: paystackSubscriptionCode, // Store the paystack subscription code
          })
          .where(eq(subscriptions.id, subscriptionId));

        console.log(
          `Activated subscription ${subscriptionId} for user ${userId}. Anniversary day: ${anniversaryDay}. Next billing: ${dayjs.utc(currentPeriodEnd).format()}. Paystack code: ${paystackSubscriptionCode}`,
        );
      }
      // CASE 2: Handle a recurring invoice payment
      else if (metadata.invoice_id) {
        const invoiceId = metadata.invoice_id;
        const [invoiceToUpdate] = await db
          .select()
          .from(invoices)
          .where(eq(invoices.id, invoiceId));

        if (!invoiceToUpdate) {
          console.warn(
            `Webhook received for invoice_id '${invoiceId}', but no matching invoice was found.`,
          );
          return NextResponse.json({ message: "Success (invoice not found)" });
        }

        if (invoiceToUpdate.status === "open") {
          await db
            .update(invoices)
            .set({ status: "paid", paidAt: new Date() })
            .where(eq(invoices.id, invoiceId));

          // Update subscription status to active and extend period
          const subscription = await db.query.subscriptions.findFirst({
            where: eq(subscriptions.id, invoiceToUpdate.subscriptionId),
          });

          if (subscription) {
            // Use anniversary day to calculate next period end, not current date
            const anniversaryDay =
              subscription.billingAnniversaryDay ||
              calculateAnniversaryDay(subscription.createdAt);

            // Next period starts from invoice's billingPeriodEnd (not NOW)
            const nextPeriodStart = dayjs
              .utc(invoiceToUpdate.billingPeriodEnd)
              .toDate();

            // Calculate next period end using anniversary day
            const nextPeriodEnd = calculateNextPeriodEnd(
              nextPeriodStart,
              anniversaryDay,
            );

            await db
              .update(subscriptions)
              .set({
                status: "active",
                currentPeriodStart: nextPeriodStart, // Use invoice end, not NOW
                currentPeriodEnd: nextPeriodEnd, // Use anniversary calculation
              })
              .where(eq(subscriptions.id, subscription.id));

            console.log(
              `Invoice ${invoiceId} paid. Extended subscription ${subscription.id} from ${dayjs.utc(nextPeriodStart).format()} to ${dayjs.utc(nextPeriodEnd).format()}`,
            );
          } else {
            console.log(
              `Invoice ${invoiceId} has been successfully marked as paid (no subscription update).`,
            );
          }
        } else {
          console.log(
            `Invoice ${invoiceId} was already in status '${invoiceToUpdate.status}'. No action taken.`,
          );
        }
      } else {
        console.warn(
          "Webhook 'charge.success' received with unhandled metadata:",
          metadata,
        );
      }
    }
    // Handle subscription lifecycle events
    else if (event.event === "subscription.create") {
      // We handle subscription creation on charge.success to ensure payment was made.
      // This event can be ignored if using the 'new-subscription' metadata flow.
      console.log(
        `Received 'subscription.create' event, but it's handled by 'charge.success'.`,
      );
    } else if (event.event === "subscription.update") {
      const { data } = event;
      const subscriptionCode = data?.subscription_code;
      const newPlanCode = data?.plan?.plan_code; // Assuming plan_code is the new plan ID from paystack
      const plan = Object.values(plans).find((p) => p.id === newPlanCode);

      if (subscriptionCode && plan) {
        const subscription = await db.query.subscriptions.findFirst({
          where: eq(subscriptions.paystackSubscriptionCode, subscriptionCode),
        });

        if (subscription) {
          await db
            .update(subscriptions)
            .set({
              plan: plan.id,
              pricePerMember: plan.pricePerMember,
            })
            .where(eq(subscriptions.id, subscription.id));
          console.log(
            `Updated subscription ${subscription.id} to plan ${plan.id}.`,
          );
        }
      }
    } else if (event.event === "subscription.disable") {
      const { data } = event;
      const subscriptionCode = data?.subscription_code;

      if (subscriptionCode) {
        // Find subscription by Paystack subscription code
        const subscription = await db.query.subscriptions.findFirst({
          where: eq(subscriptions.paystackSubscriptionCode, subscriptionCode),
        });

        if (subscription) {
          await db
            .update(subscriptions)
            .set({
              status: "canceled",
              canceledAt: new Date(),
              cancelAtPeriodEnd: true,
            })
            .where(eq(subscriptions.id, subscription.id));
          console.log(`Subscription ${subscription.id} has been canceled.`);
        } else {
          console.warn(
            `Webhook received for 'subscription.disable' with unknown subscription code: ${subscriptionCode}`,
          );
        }
      }
    } else if (event.event === "charge.failed") {
      const { data } = event;
      const metadata = data?.metadata || {};
      const invoiceId = metadata.invoice_id;

      if (invoiceId) {
        const [invoice] = await db
          .select()
          .from(invoices)
          .where(eq(invoices.id, invoiceId));
        if (invoice && invoice.status === "open") {
          // Update subscription to past_due if payment fails
          const subscription = await db.query.subscriptions.findFirst({
            where: eq(subscriptions.id, invoice.subscriptionId),
          });

          if (subscription) {
            await db
              .update(subscriptions)
              .set({
                status: "past_due",
              })
              .where(eq(subscriptions.id, subscription.id));
          }

          console.log(
            `Payment failed for invoice ${invoiceId}. Subscription marked as past_due.`,
          );
        }
      }
    } else {
      console.log(`Received unhandled Paystack event: '${event.event}'`);
    }

    // 5. Acknowledge receipt to Paystack
    return NextResponse.json({ status: "success" });
  } catch (error: any) {
    console.error("Failed to process Paystack webhook:", error);
    return new Response(`Webhook Error: ${error.message}`, {
      status: 500,
    });
  }
}
