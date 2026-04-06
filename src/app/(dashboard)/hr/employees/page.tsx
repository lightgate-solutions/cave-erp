import EmployeesTable from "@/components/hr/employees-table";
import EmployeesTableSkeleton from "@/components/hr/employees-table-skeleton";
import { Suspense } from "react";
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
    <div className="">
      <Suspense fallback={<EmployeesTableSkeleton />}>
        <EmployeesTable isHROrAdmin={isHROrAdmin} />
      </Suspense>
    </div>
  );
}
