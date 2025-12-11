/** biome-ignore-all lint/suspicious/noExplicitAny: <> */
/** biome-ignore-all lint/complexity/noUselessLoneBlockStatements: <> */
/** biome-ignore-all lint/style/useNodejsImportProtocol: <> */

import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  subscriptions,
  invoices,
  invoiceItems,
} from "@/db/schema/subscriptions";
import { organization, member } from "@/db/schema/auth";
import { and, eq, inArray, ne, desc } from "drizzle-orm";
import { sendInvoiceEmail } from "@/lib/emails";
import * as crypto from "crypto";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import {
  calculateAnniversaryDay,
  calculateNextPeriodEnd,
  isBillingAnniversary,
  wasInvoicedToday,
} from "@/lib/billing-utils";

dayjs.extend(utc);

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

  if (!process.env.CRON_SECRET) {
    console.error("CRON_SECRET not configured");
    return new Response("Server configuration error", { status: 500 });
  }

  if (authHeader !== expectedAuth) {
    console.error("Unauthorized cron request");
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const activeSubscriptions = await db.query.subscriptions.findMany({
      where: and(
        eq(subscriptions.status, "active"),
        ne(subscriptions.plan, "free"),
      ),
      with: {
        user: true,
      },
    });

    if (activeSubscriptions.length === 0) {
      return NextResponse.json({
        message: "No active subscriptions to process.",
      });
    }

    let processedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const sub of activeSubscriptions) {
      try {
        if (!sub.user) {
          continue;
        }

        let anniversaryDay = sub.billingAnniversaryDay;
        if (!anniversaryDay && sub.currentPeriodStart) {
          anniversaryDay = calculateAnniversaryDay(sub.currentPeriodStart);
          await db
            .update(subscriptions)
            .set({ billingAnniversaryDay: anniversaryDay })
            .where(eq(subscriptions.id, sub.id));
        }

        if (anniversaryDay && !isBillingAnniversary(anniversaryDay)) {
          skippedCount++;
          continue;
        }

        if (wasInvoicedToday(sub.lastInvoicedAt)) {
          skippedCount++;
          continue;
        }

        const lastInvoice = await db.query.invoices.findFirst({
          where: eq(invoices.subscriptionId, sub.id),
          orderBy: [desc(invoices.billingPeriodEnd)],
          columns: {
            billingPeriodEnd: true,
          },
        });

        let billingPeriodStart: Date;
        let billingPeriodEnd: Date;

        if (lastInvoice?.billingPeriodEnd) {
          billingPeriodStart = dayjs.utc(lastInvoice.billingPeriodEnd).toDate();
          billingPeriodEnd = calculateNextPeriodEnd(
            billingPeriodStart,
            anniversaryDay,
          );
        } else if (sub.currentPeriodStart && sub.currentPeriodEnd) {
          billingPeriodStart = dayjs.utc(sub.currentPeriodStart).toDate();
          billingPeriodEnd = dayjs.utc(sub.currentPeriodEnd).toDate();
        } else {
          billingPeriodStart = dayjs.utc(sub.createdAt).toDate();
          billingPeriodEnd = calculateNextPeriodEnd(
            billingPeriodStart,
            anniversaryDay,
          );
        }

        const existingInvoice = await db.query.invoices.findFirst({
          where: and(
            eq(invoices.subscriptionId, sub.id),
            eq(invoices.billingPeriodStart, billingPeriodStart),
            eq(invoices.billingPeriodEnd, billingPeriodEnd),
          ),
        });

        if (existingInvoice) {
          continue;
        }

        const userOrgs = await db.query.organization.findMany({
          where: eq(organization.ownerId, sub.userId),
          columns: {
            id: true,
            name: true,
          },
        });

        if (userOrgs.length === 0) {
          continue;
        }

        const orgIds = userOrgs.map((o) => o.id);

        const billableMembers = await db.query.member.findMany({
          where: inArray(member.organizationId, orgIds),
          with: {
            user: {
              columns: {
                email: true,
              },
            },
          },
        });

        const seenUserIds = new Set<string>();
        const membersToBill = billableMembers.filter((m) => {
          if (seenUserIds.has(m.userId)) {
            return false;
          }
          seenUserIds.add(m.userId);
          return true;
        });

        if (membersToBill.length === 0) {
          continue;
        }

        const dueDate = dayjs.utc(billingPeriodEnd).add(3, "days").toDate();

        const invoiceId = `inv_${crypto.randomUUID()}`;
        const [newInvoice] = await db
          .insert(invoices)
          .values({
            id: invoiceId,
            subscriptionId: sub.id,
            status: "open",
            amount: "0",
            currency: "NGN",
            billingPeriodStart: billingPeriodStart,
            billingPeriodEnd: billingPeriodEnd,
            dueDate: dayjs.utc(dueDate).format("YYYY-MM-DD"),
          })
          .returning();

        let totalAmount = 0;
        const invoiceItemsToCreate: (typeof invoiceItems.$inferInsert)[] = [];
        const pricePerMember = parseFloat(sub.pricePerMember ?? "0");

        for (const m of membersToBill) {
          const memberOrgs = billableMembers.filter(
            (bm) => bm.userId === m.userId,
          );

          const orgNames = memberOrgs
            .map((mo) => {
              const org = userOrgs.find((o) => o.id === mo.organizationId);
              return org?.name || "Unknown";
            })
            .join(", ");

          const memberJoinDate = dayjs.utc(m.createdAt).toDate();
          const memberBillingStart =
            memberJoinDate > billingPeriodStart
              ? memberJoinDate
              : billingPeriodStart;

          const memberLeftDate = m.deletedAt
            ? dayjs.utc(m.deletedAt).toDate()
            : null;
          let memberBillingEnd = billingPeriodEnd;
          let wasMemberRemoved = false;

          if (
            memberLeftDate &&
            memberLeftDate < billingPeriodEnd &&
            memberLeftDate > billingPeriodStart
          ) {
            memberBillingEnd = memberLeftDate;
            wasMemberRemoved = true;
          }

          const totalDaysInPeriod = dayjs
            .utc(billingPeriodEnd)
            .diff(dayjs.utc(billingPeriodStart), "day");
          const daysInPeriod = dayjs
            .utc(memberBillingEnd)
            .diff(dayjs.utc(memberBillingStart), "day");

          const isProrated =
            memberBillingStart > billingPeriodStart || wasMemberRemoved;
          const proratedAmount = isProrated
            ? (daysInPeriod / totalDaysInPeriod) * pricePerMember
            : pricePerMember;

          totalAmount += proratedAmount;

          const planName =
            sub.plan === "pro"
              ? "Pro Plan"
              : sub.plan === "premium"
                ? "Premium Plan"
                : "Standard Plan";

          let prorationNote = "";
          if (isProrated) {
            prorationNote = ` [Prorated: ${daysInPeriod}/${totalDaysInPeriod} days`;
            if (wasMemberRemoved) {
              prorationNote += ", removed mid-period";
            }
            prorationNote += "]";
          }

          invoiceItemsToCreate.push({
            id: `item_${crypto.randomUUID()}`,
            invoiceId: newInvoice.id,
            memberId: m.id,
            organizationId: memberOrgs[0].organizationId, // Primary org
            description: `${planName} - Member (${m.user?.email || "Unknown"}) in Orgs: ${orgNames}${prorationNote}`,
            amount: String(proratedAmount.toFixed(2)),
            prorated: isProrated,
            billingPeriodStart: memberBillingStart,
            billingPeriodEnd: memberBillingEnd,
          });
        }

        if (invoiceItemsToCreate.length > 0) {
          await db.insert(invoiceItems).values(invoiceItemsToCreate);
        }

        await db
          .update(invoices)
          .set({ amount: String(totalAmount.toFixed(2)) })
          .where(eq(invoices.id, newInvoice.id));

        const PAYSTACK_API_URL =
          "https://api.paystack.co/transaction/initialize";
        const secretKey = process.env.PAYSTACK_SECRET_KEY;
        let paymentLink = "";

        if (secretKey) {
          try {
            const amountInKobo = Math.round(totalAmount * 100);
            const transactionData = {
              email: sub.user.email,
              amount: amountInKobo,
              metadata: {
                invoice_id: newInvoice.id,
                user_id: sub.userId,
                type: "invoice-payment",
              },
            };

            const response = await fetch(PAYSTACK_API_URL, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${secretKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(transactionData),
            });

            const data = await response.json();
            if (data.status && data.data.authorization_url) {
              paymentLink = data.data.authorization_url;
            } else {
              console.error("Failed to generate Paystack link:", data.message);
            }
          } catch (err) {
            console.error("Error generating Paystack link:", err);
          }
        }

        await sendInvoiceEmail({
          to: sub.user.email,
          invoiceDetails: {
            invoiceId: newInvoice.id,
            amount: totalAmount,
            dueDate:
              newInvoice.dueDate || dayjs.utc(dueDate).format("YYYY-MM-DD"),
            items: invoiceItemsToCreate.map((it) => ({
              description: it.description,
              amount: it.amount,
            })),
            paymentLink: paymentLink,
          },
        });

        await db
          .update(subscriptions)
          .set({ lastInvoicedAt: new Date() })
          .where(eq(subscriptions.id, sub.id));

        processedCount++;
      } catch (error: any) {
        errorCount++;
        console.error(`Failed to process subscription ${sub.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${processedCount} subscriptions successfully. ${skippedCount} skipped. ${errorCount} errors.`,
      processed: processedCount,
      skipped: skippedCount,
      errors: errorCount,
      total: activeSubscriptions.length,
    });
  } catch (error: any) {
    console.error("Cron job for invoicing failed:", error);
    return new Response(`Error: ${error.message}`, {
      status: 500,
    });
  }
}
