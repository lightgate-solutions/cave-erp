import { db } from "@/db";
import { notifications } from "@/db/schema/notifications";
import { employees } from "@/db/schema/hr";
import { eq, and, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const h = await headers();
    const session = await auth.api.getSession({ headers: h });
    const authUserId = session?.user?.id;

    if (!authUserId) {
      return Response.json({ success: false, count: 0 });
    }

    const organization = await auth.api.getFullOrganization({ headers: h });
    if (!organization) {
      return Response.json({ success: false, count: 0 });
    }

    // Get employee info to get the employee ID (notifications.user_id references user.id which is authId)
    const employeeResult = await db
      .select({ authId: employees.authId })
      .from(employees)
      .where(
        and(
          eq(employees.authId, authUserId),
          eq(employees.organizationId, organization.id),
        ),
      )
      .limit(1);

    const employee = employeeResult[0];
    if (!employee) {
      return Response.json({ success: false, count: 0 });
    }

    // Use proper Drizzle ORM syntax for counting
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(
        and(
          eq(notifications.user_id, employee.authId),
          eq(notifications.is_read, false),
          eq(notifications.organizationId, organization.id),
        ),
      );

    const count = Number(result[0]?.count ?? 0);

    return Response.json({ success: true, count });
  } catch (error) {
    console.error("Error fetching unread notification count:", error);
    // Return 0 count if table doesn't exist or any other error occurs
    return Response.json({ success: false, count: 0 });
  }
}
