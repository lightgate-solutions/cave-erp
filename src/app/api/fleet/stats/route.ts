import { db } from "@/db";
import {
  vehicles,
  fleetMaintenance,
  fleetIncidents,
  companyExpenses,
  driverAssignments,
  drivers,
} from "@/db/schema";
import { and, eq, sql, gte, lte, isNull } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET: Fleet analytics and statistics
export async function GET(request: NextRequest) {
  try {
    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });
    if (!organization) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    // Build where clauses upfront
    const expenseWhere = and(
      eq(companyExpenses.organizationId, organization.id),
      eq(companyExpenses.isFleetExpense, true),
      from && to
        ? and(
            gte(companyExpenses.expenseDate, new Date(from)),
            lte(companyExpenses.expenseDate, new Date(to)),
          )
        : undefined,
    );

    const maintenanceWhere = and(
      eq(fleetMaintenance.organizationId, organization.id),
      from && to
        ? and(
            gte(fleetMaintenance.maintenanceDate, new Date(from)),
            lte(fleetMaintenance.maintenanceDate, new Date(to)),
          )
        : undefined,
    );

    const incidentWhere = and(
      eq(fleetIncidents.organizationId, organization.id),
      from && to
        ? and(
            gte(fleetIncidents.incidentDate, new Date(from)),
            lte(fleetIncidents.incidentDate, new Date(to)),
          )
        : undefined,
    );

    const today = new Date();
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Parallelize all 12 independent database queries (async-parallel)
    const [
      vehicleStats,
      expenseStatsResult,
      expenseByCategory,
      maintenanceStatsResult,
      incidentStatsResult,
      incidentBySeverity,
      complianceAlertsResult,
      driverLicenseAlertsResult,
      assignmentStatsResult,
      driverStats,
      maintenanceByType,
      expenseTrends,
    ] = await Promise.all([
      // 1. Total vehicle count by status
      db
        .select({
          status: vehicles.status,
          count: sql<number>`count(*)::int`,
        })
        .from(vehicles)
        .where(eq(vehicles.organizationId, organization.id))
        .groupBy(vehicles.status),

      // 2. Total fleet expenses
      db
        .select({
          total: sql<string>`COALESCE(SUM(${companyExpenses.amount}), 0)`,
          count: sql<number>`count(*)::int`,
        })
        .from(companyExpenses)
        .where(expenseWhere),

      // 3. Expense breakdown by fleet category
      db
        .select({
          category: companyExpenses.fleetExpenseCategory,
          total: sql<string>`SUM(${companyExpenses.amount})`,
          count: sql<number>`count(*)::int`,
        })
        .from(companyExpenses)
        .where(expenseWhere)
        .groupBy(companyExpenses.fleetExpenseCategory),

      // 4. Maintenance costs
      db
        .select({
          total: sql<string>`COALESCE(SUM(${fleetMaintenance.cost}), 0)`,
          count: sql<number>`count(*)::int`,
        })
        .from(fleetMaintenance)
        .where(maintenanceWhere),

      // 5. Incident statistics
      db
        .select({
          total: sql<number>`count(*)::int`,
          resolved: sql<number>`count(*) FILTER (WHERE ${fleetIncidents.resolutionStatus} = 'Resolved')::int`,
          pending: sql<number>`count(*) FILTER (WHERE ${fleetIncidents.resolutionStatus} != 'Resolved')::int`,
        })
        .from(fleetIncidents)
        .where(incidentWhere),

      // 6. Incident breakdown by severity
      db
        .select({
          severity: fleetIncidents.severity,
          count: sql<number>`count(*)::int`,
        })
        .from(fleetIncidents)
        .where(incidentWhere)
        .groupBy(fleetIncidents.severity),

      // 7. Compliance alerts (expiring soon - within 30 days)
      db
        .select({
          expiringInsurance: sql<number>`count(*) FILTER (WHERE ${vehicles.insuranceExpiryDate} BETWEEN ${today} AND ${thirtyDaysFromNow})::int`,
          expiringRegistration: sql<number>`count(*) FILTER (WHERE ${vehicles.registrationExpiryDate} BETWEEN ${today} AND ${thirtyDaysFromNow})::int`,
          expiredInsurance: sql<number>`count(*) FILTER (WHERE ${vehicles.insuranceExpiryDate} < ${today})::int`,
          expiredRegistration: sql<number>`count(*) FILTER (WHERE ${vehicles.registrationExpiryDate} < ${today})::int`,
        })
        .from(vehicles)
        .where(eq(vehicles.organizationId, organization.id)),

      // 8. Driver license expiry alerts
      db
        .select({
          expiringLicenses: sql<number>`count(*) FILTER (WHERE ${drivers.licenseExpiryDate} BETWEEN ${today} AND ${thirtyDaysFromNow})::int`,
          expiredLicenses: sql<number>`count(*) FILTER (WHERE ${drivers.licenseExpiryDate} < ${today})::int`,
        })
        .from(drivers)
        .where(
          and(
            eq(drivers.organizationId, organization.id),
            eq(drivers.status, "Active"),
          ),
        ),

      // 9. Active assignments count
      db
        .select({
          total: sql<number>`count(*)::int`,
        })
        .from(driverAssignments)
        .where(
          and(
            eq(driverAssignments.organizationId, organization.id),
            isNull(driverAssignments.endDate),
          ),
        ),

      // 10. Total driver count by status
      db
        .select({
          status: drivers.status,
          count: sql<number>`count(*)::int`,
        })
        .from(drivers)
        .where(eq(drivers.organizationId, organization.id))
        .groupBy(drivers.status),

      // 11. Maintenance breakdown by type
      db
        .select({
          type: fleetMaintenance.maintenanceType,
          count: sql<number>`count(*)::int`,
          totalCost: sql<string>`SUM(${fleetMaintenance.cost})`,
        })
        .from(fleetMaintenance)
        .where(maintenanceWhere)
        .groupBy(fleetMaintenance.maintenanceType),

      // 12. Expense trends (last 6 months by month)
      db
        .select({
          month: sql<string>`TO_CHAR(${companyExpenses.expenseDate}, 'YYYY-MM')`,
          total: sql<string>`SUM(${companyExpenses.amount})`,
          count: sql<number>`count(*)::int`,
        })
        .from(companyExpenses)
        .where(
          and(
            eq(companyExpenses.organizationId, organization.id),
            eq(companyExpenses.isFleetExpense, true),
            gte(companyExpenses.expenseDate, sixMonthsAgo),
          ),
        )
        .groupBy(sql`TO_CHAR(${companyExpenses.expenseDate}, 'YYYY-MM')`)
        .orderBy(sql`TO_CHAR(${companyExpenses.expenseDate}, 'YYYY-MM')`),
    ]);

    const [expenseStats] = expenseStatsResult;
    const [maintenanceStats] = maintenanceStatsResult;
    const [incidentStats] = incidentStatsResult;
    const [complianceAlerts] = complianceAlertsResult;
    const [driverLicenseAlerts] = driverLicenseAlertsResult;
    const [assignmentStats] = assignmentStatsResult;

    return NextResponse.json({
      vehicleStats,
      driverStats,
      expenseStats: {
        total: expenseStats?.total || "0",
        count: expenseStats?.count || 0,
      },
      expenseByCategory: expenseByCategory.filter((e) => e.category !== null),
      expenseTrends,
      maintenanceStats: {
        total: maintenanceStats?.total || "0",
        count: maintenanceStats?.count || 0,
      },
      maintenanceByType,
      incidentStats: {
        total: incidentStats?.total || 0,
        resolved: incidentStats?.resolved || 0,
        pending: incidentStats?.pending || 0,
      },
      incidentBySeverity,
      complianceAlerts: {
        expiringInsurance: complianceAlerts?.expiringInsurance || 0,
        expiringRegistration: complianceAlerts?.expiringRegistration || 0,
        expiredInsurance: complianceAlerts?.expiredInsurance || 0,
        expiredRegistration: complianceAlerts?.expiredRegistration || 0,
        expiringDriverLicenses: driverLicenseAlerts?.expiringLicenses || 0,
        expiredDriverLicenses: driverLicenseAlerts?.expiredLicenses || 0,
      },
      activeAssignments: assignmentStats?.total || 0,
    });
  } catch (error) {
    console.error("Error fetching fleet stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch fleet statistics" },
      { status: 500 },
    );
  }
}
