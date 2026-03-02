import AnnualLeaveBalancesTable from "@/components/hr/annual-leave-balances-table";
import { requireAuth } from "@/actions/auth/dal";
import { DEPARTMENTS } from "@/lib/permissions/types";
import { redirect } from "next/navigation";

export default async function Page() {
  const authData = await requireAuth();

  const isHROrAdmin =
    authData.role === "admin" ||
    authData.employee?.department === DEPARTMENTS.HR ||
    authData.employee?.department === DEPARTMENTS.ADMIN;

  if (!isHROrAdmin) {
    redirect("/unauthorized");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div>
            <h1 className="text-2xl font-bold">Annual Leave Balances</h1>
            <p className="text-sm text-muted-foreground">
              Manage annual leave allocations for employees
            </p>
          </div>
        </div>
      </div>
      <AnnualLeaveBalancesTable />
    </div>
  );
}
