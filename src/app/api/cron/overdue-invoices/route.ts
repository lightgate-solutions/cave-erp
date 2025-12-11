/** biome-ignore-all lint/suspicious/noExplicitAny: <> */

import { NextResponse } from "next/server";
import { db } from "@/db";
import { invoices, subscriptions } from "@/db/schema/subscriptions";
import { and, eq, lt } from "drizzle-orm";
import { sendOverdueInvoiceEmail } from "@/lib/emails";
import { calculateDaysOverdue } from "@/lib/billing-utils";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

  if (!process.env.CRON_SECRET) {
    console.error("CRON_SECRET not configured");
    return new Response("Server configuration error", { status: 500 });
  }

  if (authHeader !== expectedAuth) {
    console.error("Unauthorized cron request to overdue-invoices");
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const now = new Date();
    const todayDateString = now.toISOString().split("T")[0];

    const overdueInvoices = await db.query.invoices.findMany({
      where: and(
        eq(invoices.status, "open"),
        lt(invoices.dueDate, todayDateString),
      ),
      with: {
        subscription: {
          with: {
            user: {
              columns: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (overdueInvoices.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No overdue invoices found",
        processed: 0,
      });
    }

    let updatedCount = 0;
    const errors: Array<{ invoiceId: string; error: string }> = [];

    for (const invoice of overdueInvoices) {
      try {
        if (!invoice.subscription) {
          console.error(`Invoice ${invoice.id} has no associated subscription`);
          errors.push({
            invoiceId: invoice.id,
            error: "No associated subscription",
          });
          continue;
        }

        await db
          .update(invoices)
          .set({ status: "uncollectible" })
          .where(eq(invoices.id, invoice.id));

        if (invoice.subscription.status !== "canceled") {
          await db
            .update(subscriptions)
            .set({ status: "past_due" })
            .where(eq(subscriptions.id, invoice.subscriptionId));
        }

        await sendOverdueInvoiceEmail({
          to: invoice.subscription.user.email,
          userName: invoice.subscription.user.name,
          invoiceId: invoice.id,
          amount: parseFloat(invoice.amount),
          dueDate: invoice.dueDate || "",
          daysOverdue: calculateDaysOverdue(invoice.dueDate || now, now),
        });

        console.log(
          `Marked invoice ${invoice.id} as overdue. Subscription ${invoice.subscriptionId} → past_due`,
        );

        updatedCount++;
      } catch (error: any) {
        console.error(
          `Failed to process overdue invoice ${invoice.id}:`,
          error,
        );
        errors.push({
          invoiceId: invoice.id,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${updatedCount} overdue invoices`,
      processed: updatedCount,
      total: overdueInvoices.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("Overdue invoice cron failed:", error);
    return new Response(`Error: ${error.message}`, {
      status: 500,
    });
  }
}
