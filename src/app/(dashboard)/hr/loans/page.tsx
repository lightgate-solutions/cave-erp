import { requireAuth } from "@/actions/auth/dal";
import { DEPARTMENTS } from "@/lib/permissions/types";
import LoanApplicationsTable from "@/components/loans/loan-applications-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Settings } from "lucide-react";

export default async function LoansPage() {
  const authData = await requireAuth();

  const isHROrAdmin =
    authData.role === "admin" ||
    authData.employee?.department === DEPARTMENTS.HR ||
    authData.employee?.department === DEPARTMENTS.ADMIN;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div>
            <h1 className="text-2xl font-bold">
              {isHROrAdmin ? "Loan Management" : "My Loans"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isHROrAdmin
                ? "Review and manage employee loan applications"
                : "View and apply for loans"}
            </p>
          </div>
        </div>
        {isHROrAdmin && (
          <Button asChild variant="outline">
            <Link href="/hr/loans/types">
              <Settings className="mr-2 h-4 w-4" />
              Manage Loan Types
            </Link>
          </Button>
        )}
      </div>

      <LoanApplicationsTable
        userId={isHROrAdmin ? undefined : authData.userId}
        isHR={isHROrAdmin}
        showFilters={true}
      />
    </div>
  );
}
