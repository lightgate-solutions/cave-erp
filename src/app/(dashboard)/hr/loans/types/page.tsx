import { BackButton } from "@/components/ui/back-button";
import { requireAuth } from "@/actions/auth/dal";
import { DEPARTMENTS } from "@/lib/permissions/types";
import { redirect } from "next/navigation";
import LoanTypesTable from "@/components/loans/loan-types-table";

export default async function LoanTypesPage() {
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
      <div className="flex items-start gap-4">
        <BackButton href="/hr/loans" label="Back to Loan Management" />
        <div>
          <h1 className="text-2xl font-bold">Loan Types</h1>
          <p className="text-sm text-muted-foreground">
            Configure loan types and eligibility rules
          </p>
        </div>
      </div>

      <LoanTypesTable userId={authData.userId} />
    </div>
  );
}
